import type { BrainCitation } from "@/lib/brain-types";
import { expandForEmbed, tokenize } from "@/lib/embed";
import { formatTimestamp, publicTitle, youtubeWatchUrl } from "@/lib/format";
import type { LibraryResult, TranscriptHit } from "@/lib/search";

export type { BrainCitation } from "@/lib/brain-types";

export const BRAIN_DISCLAIMER =
  "Cite-only excerpts from Institute recordings. Not clinical advice. Watch the cited clip before using anything in practice.";

export const BRAIN_NOT_FOUND = "I couldn't find that in the library.";

export const MAX_CITATIONS = 4;
export const MAX_HITS_PER_VIDEO = 2;

/** Keyword / both clips are already grounded in spoken words. */
export const MIN_KEYWORD_SCORE = 0.5;
/** Semantic-only clips need a stronger parent-video score. */
export const MIN_SEMANTIC_SCORE = 0.4;
/** Once at least one decent clip exists, fill supporting cites above this floor. */
export const INCLUDE_FLOOR = 0.28;

type RankedClip = {
  videoId: string;
  youtubeId: string;
  title: string;
  speakers: string[];
  startMs: number;
  endMs: number | null;
  text: string;
  source: TranscriptHit["source"];
  score: number;
};

export function clipScore(videoScore: number, source: TranscriptHit["source"]): number {
  let score = videoScore;
  if (source === "both") score += 0.06;
  else if (source === "keyword") score += 0.03;
  return score;
}

export function isDecentClip(score: number, source: TranscriptHit["source"]): boolean {
  if (source === "keyword" || source === "both") return score >= MIN_KEYWORD_SCORE;
  return score >= MIN_SEMANTIC_SCORE;
}

/** Hash collisions can score; require the clip/title to share expanded query tokens. */
export function isGroundedClip(
  question: string,
  title: string,
  text: string,
  source: TranscriptHit["source"],
): boolean {
  if (source === "keyword" || source === "both") return true;
  const needle = question.trim();
  if (!needle) return false;
  const tokens = tokenize(expandForEmbed(needle)).filter((token) => token.length > 3 && !token.includes("_"));
  if (tokens.length === 0) return false;
  const haystack = `${title} ${text}`.toLowerCase();
  return tokens.some((token) => haystack.includes(token));
}

function toCitation(clip: RankedClip, n: number): BrainCitation {
  const startSec = Math.floor(clip.startMs / 1000);
  return {
    n,
    videoId: clip.videoId,
    youtubeId: clip.youtubeId,
    title: clip.title,
    speaker: clip.speakers[0] ?? null,
    startSec,
    endSec: clip.endMs != null ? Math.floor(clip.endMs / 1000) : null,
    text: clip.text,
    source: clip.source ?? "keyword",
    libraryUrl: `/library/${clip.videoId}?t=${startSec}`,
    youtubeUrl: youtubeWatchUrl(clip.youtubeId, startSec),
    score: Number(clip.score.toFixed(4)),
  };
}

/**
 * Flatten hybrid library hits into 2–4 citations.
 * Diversifies ≤2 clips / video. Empty when nothing is confident enough.
 */
export function pickCitations(results: LibraryResult[], question = ""): BrainCitation[] {
  const ranked: RankedClip[] = [];

  for (const video of results) {
    const title = publicTitle(video);
    for (const hit of video.hits) {
      const text = hit.text.replace(/\s+/g, " ").trim();
      if (!text) continue;
      if (!isGroundedClip(question, title, text, hit.source)) continue;
      ranked.push({
        videoId: video.id,
        youtubeId: video.youtubeId,
        title,
        speakers: video.speakers,
        startMs: hit.startMs,
        endMs: hit.endMs,
        text,
        source: hit.source,
        score: clipScore(video.score ?? 0, hit.source),
      });
    }
  }

  ranked.sort((left, right) => right.score - left.score || left.startMs - right.startMs);

  const hasDecent = ranked.some((clip) => isDecentClip(clip.score, clip.source));
  if (!hasDecent) return [];

  const perVideo = new Map<string, number>();
  const selected: RankedClip[] = [];
  for (const clip of ranked) {
    if (clip.score < INCLUDE_FLOOR) continue;
    const used = perVideo.get(clip.videoId) ?? 0;
    if (used >= MAX_HITS_PER_VIDEO) continue;
    perVideo.set(clip.videoId, used + 1);
    selected.push(clip);
    if (selected.length >= MAX_CITATIONS) break;
  }

  return selected.map((clip, index) => toCitation(clip, index + 1));
}

export function excerptClip(text: string, max = 220): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) return cleaned;
  const sliced = cleaned.slice(0, max).replace(/\s+\S*$/, "").trim();
  return `${sliced || cleaned.slice(0, max)}…`;
}

/** Template summary used when no LLM key is set (or the provider call fails). */
export function templateAnswer(citations: BrainCitation[]): string {
  if (!citations.length) return BRAIN_NOT_FOUND;
  const lines = citations.map((citation) => {
    const who = citation.speaker ? ` — ${citation.speaker}` : "";
    const when = formatTimestamp(citation.startSec * 1000);
    return `[${citation.n}] ${citation.title}${who} (${when}): “${excerptClip(citation.text)}”`;
  });
  return (
    `The library has ${citations.length} cited clip${citations.length === 1 ? "" : "s"} that speak to this. ` +
    `This restates only those excerpts — not clinical advice.\n\n${lines.join("\n\n")}`
  );
}
