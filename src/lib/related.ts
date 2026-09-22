import { prisma } from "@/lib/db";
import { parseJsonArray } from "@/lib/json";
import {
  RELATED_LIMIT,
  earlyTranscriptText,
  rankRelatedRecordings,
  relatedRetrieveQuery,
  type RelatedCandidate,
} from "@/lib/related-rank";
import { searchVectorIndex } from "@/lib/vector-index";

export type RelatedRecording = {
  id: string;
  title: string;
  displayTitle: string | null;
  thumbnailUrl: string;
  durationSec: number;
  programs: string[];
};

const SEMANTIC_TOP_K = 48;

/**
 * Up to three catalog recordings for the watch page.
 * Program and topic bands are filled from rows already in the library database.
 * Embedding retrieve runs only when those bands leave an open slot.
 */
export async function relatedRecordingsForVideo(video: {
  id: string;
  youtubeId: string;
  title: string;
  displayTitle: string | null;
  description: string;
  programs: string[];
  topics: string[];
  segments: ReadonlyArray<{ startMs: number; text: string }>;
}): Promise<RelatedRecording[]> {
  const rows = await prisma.video.findMany({
    where: {
      NOT: {
        OR: [{ id: video.id }, { youtubeId: video.youtubeId }],
      },
    },
    select: {
      id: true,
      youtubeId: true,
      title: true,
      displayTitle: true,
      publishedAt: true,
      durationSec: true,
      thumbnailUrl: true,
      programs: true,
      topics: true,
    },
  });

  const candidates: RelatedCandidate[] = rows.map((row) => ({
    id: row.id,
    youtubeId: row.youtubeId,
    title: row.title,
    displayTitle: row.displayTitle,
    publishedAt: row.publishedAt,
    durationSec: row.durationSec,
    thumbnailUrl: row.thumbnailUrl,
    programs: parseJsonArray(row.programs),
    topics: parseJsonArray(row.topics),
  }));

  const source = {
    id: video.id,
    youtubeId: video.youtubeId,
    programs: video.programs,
    topics: video.topics,
  };

  const withoutSemantic = rankRelatedRecordings(source, candidates);
  let semanticScores = new Map<string, number>();

  if (withoutSemantic.length < RELATED_LIMIT) {
    const query = relatedRetrieveQuery({
      title: video.title,
      displayTitle: video.displayTitle,
      description: video.description,
      earlyTranscript: earlyTranscriptText(video.segments),
    });
    if (query.trim()) {
      try {
        const hits = await searchVectorIndex(query, { topK: SEMANTIC_TOP_K, maxPerVideo: 1 });
        semanticScores = new Map();
        for (const hit of hits) {
          if (!hit.youtubeId || hit.youtubeId === video.youtubeId) continue;
          const previous = semanticScores.get(hit.youtubeId) ?? 0;
          if (hit.score > previous) semanticScores.set(hit.youtubeId, hit.score);
        }
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        console.warn(`Related content semantic retrieve skipped: ${reason}`);
      }
    }
  }

  const ranked = semanticScores.size > 0 ? rankRelatedRecordings(source, candidates, semanticScores) : withoutSemantic;

  return ranked.map((item) => ({
    id: item.id,
    title: item.title,
    displayTitle: item.displayTitle,
    thumbnailUrl: item.thumbnailUrl,
    durationSec: item.durationSec,
    programs: item.programs,
  }));
}
