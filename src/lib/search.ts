import type { Prisma } from "@prisma/client";
import { isBrowseId, videoMatchesBrowse } from "@/lib/browse";
import { prisma } from "@/lib/db";
import { publicTitle } from "@/lib/format";
import { parseJsonArray } from "@/lib/json";
import { isProgram } from "@/lib/programs";
import { isRecordingType } from "@/lib/recording-types";
import { normalizeLibraryFilters } from "@/lib/taxonomy";
import { expandForEmbed } from "@/lib/embed";
import { lastVectorSearchError, searchVectorIndex, type SemanticHit } from "@/lib/vector-index";

export const LIBRARY_PAGE_SIZE = 24;
export const MAX_HITS_PER_VIDEO = 2;

export type LibraryFilters = {
  q?: string;
  browse?: string;
  program?: string;
  recordingType?: string;
  speaker?: string;
  year?: string;
  topic?: string;
  page?: string;
};

export type TranscriptHit = {
  startMs: number;
  endMs: number | null;
  text: string;
  source?: "keyword" | "semantic" | "both";
};

export type LibraryResult = {
  id: string;
  youtubeId: string;
  title: string;
  displayTitle: string | null;
  description: string;
  publishedAt: Date;
  durationSec: number;
  thumbnailUrl: string;
  speakers: string[];
  programs: string[];
  topics: string[];
  recordingType: string;
  hits: TranscriptHit[];
  score?: number;
};

export type LibrarySearchPage = {
  results: LibraryResult[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  semanticUsed: boolean;
  /** Present when the neural query embed failed; keyword search still ran. */
  semanticError?: string | null;
};

function containsFilter(query: string): Prisma.StringFilter {
  return { contains: query };
}

export function parseLibraryPage(value?: string): number {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

async function browseWhere(browse?: string): Promise<Prisma.VideoWhereInput | null> {
  if (!browse || !isBrowseId(browse)) return null;
  const videos = await prisma.video.findMany({
    select: { id: true, title: true, displayTitle: true, programs: true, topics: true, recordingType: true },
  });
  const ids = videos
    .filter((video) =>
      videoMatchesBrowse(browse, {
        title: video.title,
        displayTitle: video.displayTitle,
        programs: parseJsonArray(video.programs),
        topics: parseJsonArray(video.topics),
        recordingType: video.recordingType,
      }),
    )
    .map((video) => video.id);
  return { id: { in: ids } };
}

async function videoWhere(filters: LibraryFilters): Promise<Prisma.VideoWhereInput> {
  const query = filters.q?.trim() ?? "";
  const and: Prisma.VideoWhereInput[] = [];

  const browseClause = await browseWhere(filters.browse);
  if (browseClause) and.push(browseClause);

  if (filters.program && isProgram(filters.program)) {
    and.push({ programs: containsFilter(filters.program) });
  }
  if (filters.recordingType && isRecordingType(filters.recordingType)) {
    and.push({ recordingType: filters.recordingType });
  }
  if (filters.speaker) {
    and.push({ speakers: containsFilter(filters.speaker) });
  }
  if (filters.topic) {
    and.push({ topics: containsFilter(filters.topic) });
  }
  if (filters.year && /^\d{4}$/.test(filters.year)) {
    const year = Number(filters.year);
    and.push({
      publishedAt: {
        gte: new Date(Date.UTC(year, 0, 1)),
        lt: new Date(Date.UTC(year + 1, 0, 1)),
      },
    });
  }
  if (query) {
    and.push({
      OR: [
        { title: containsFilter(query) },
        { displayTitle: containsFilter(query) },
        { description: containsFilter(query) },
        { speakers: containsFilter(query) },
        { topics: containsFilter(query) },
        { segments: { some: { text: containsFilter(query) } } },
      ],
    });
  }

  return and.length ? { AND: and } : {};
}

function emptyPage(page: number): LibrarySearchPage {
  return {
    results: [],
    total: 0,
    page: Math.max(1, page),
    pageSize: LIBRARY_PAGE_SIZE,
    pageCount: 1,
    semanticUsed: false,
    semanticError: null,
  };
}

function mapVideoBase(video: {
  id: string;
  youtubeId: string;
  title: string;
  displayTitle: string | null;
  description: string;
  publishedAt: Date;
  durationSec: number;
  thumbnailUrl: string;
  speakers: string;
  programs: string;
  topics: string;
  recordingType?: string | null;
}): Omit<LibraryResult, "hits" | "score"> {
  return {
    id: video.id,
    youtubeId: video.youtubeId,
    title: video.title,
    displayTitle: video.displayTitle,
    description: video.description,
    publishedAt: video.publishedAt,
    durationSec: video.durationSec,
    thumbnailUrl: video.thumbnailUrl,
    speakers: parseJsonArray(video.speakers),
    programs: parseJsonArray(video.programs),
    topics: parseJsonArray(video.topics),
    recordingType: video.recordingType?.trim() ?? "",
  };
}

function nearestSegment<T extends { startMs: number; endMs: number | null; text: string }>(
  segments: T[],
  startMs: number,
): T | undefined {
  let best: T | undefined;
  let bestDelta = Infinity;
  for (const segment of segments) {
    const delta = Math.abs(segment.startMs - startMs);
    if (delta < bestDelta) {
      best = segment;
      bestDelta = delta;
    }
  }
  return bestDelta <= 2500 ? best : undefined;
}

function mergeHits(
  keywordSegments: Array<{ startMs: number; endMs: number | null; text: string }>,
  semanticHits: SemanticHit[],
  allSegments: Array<{ startMs: number; endMs: number | null; text: string }>,
): TranscriptHit[] {
  type Ranked = TranscriptHit & { rank: number };
  const merged = new Map<number, Ranked>();

  for (const segment of keywordSegments) {
    merged.set(segment.startMs, {
      startMs: segment.startMs,
      endMs: segment.endMs,
      text: segment.text,
      source: "keyword",
      rank: 0.78,
    });
  }

  for (const hit of semanticHits) {
    const segment =
      allSegments.find((item) => item.startMs === hit.startMs) ??
      nearestSegment(allSegments, hit.startMs);
    const startMs = segment?.startMs ?? hit.startMs;
    const existing = merged.get(startMs);
    if (existing) {
      existing.source = "both";
      existing.rank = Math.max(existing.rank, hit.score + 0.12);
      continue;
    }
    merged.set(startMs, {
      startMs,
      endMs: segment?.endMs ?? hit.endMs,
      text: segment?.text ?? "",
      source: "semantic",
      rank: hit.score,
    });
  }

  return [...merged.values()]
    .filter((hit) => hit.text.trim().length > 0)
    .sort((left, right) => right.rank - left.rank || left.startMs - right.startMs)
    .slice(0, MAX_HITS_PER_VIDEO)
    .map((hit) => ({
      startMs: hit.startMs,
      endMs: hit.endMs,
      text: hit.text,
      source: hit.source,
    }));
}

function scoreVideo(
  video: { title: string; displayTitle: string | null; speakers: string[] },
  query: string,
  keywordHitCount: number,
  semanticHits: SemanticHit[],
): number {
  const haystack = `${publicTitle(video)} ${video.speakers.join(" ")}`.toLowerCase();
  const needle = query.toLowerCase();
  const expanded = expandForEmbed(query).toLowerCase();
  let score = semanticHits[0]?.score ?? 0;
  if (keywordHitCount > 0) score = Math.max(score, 0.74);
  // Title / displayTitle / speaker substring must beat weak semantic neighbors
  // (otherwise “Immunoglobulins” buries the named talk under Mastermind noise).
  if (needle.length >= 3 && haystack.includes(needle)) {
    score = Math.max(score, 0.94);
  }
  const tokens = expanded.split(/[^a-z0-9+]+/).filter((token) => token.length > 3);
  const titleHits = tokens.filter((token) => haystack.includes(token)).length;
  if (tokens.length) score += Math.min(0.22, titleHits * 0.045);
  if (keywordHitCount > 0 && semanticHits.length > 0) score += 0.04;
  return score;
}

export async function searchLibrary(input: LibraryFilters): Promise<LibrarySearchPage> {
  const filters = normalizeLibraryFilters(input);
  const query = filters.q?.trim() ?? "";
  const requestedPage = parseLibraryPage(filters.page);

  if (!query) {
    const where = await videoWhere(filters);
    const total = await prisma.video.count({ where });
    const pageCount = Math.max(1, Math.ceil(total / LIBRARY_PAGE_SIZE));
    const page = Math.min(requestedPage, pageCount);
    const videos = await prisma.video.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * LIBRARY_PAGE_SIZE,
      take: LIBRARY_PAGE_SIZE,
    });
    return {
      total,
      page,
      pageSize: LIBRARY_PAGE_SIZE,
      pageCount,
      semanticUsed: false,
      semanticError: null,
      results: videos.map((video) => ({ ...mapVideoBase(video), hits: [] })),
    };
  }

  const filterWhere = await videoWhere({ ...filters, q: undefined });
  const keywordWhere = await videoWhere(filters);
  const keywordRows = await prisma.video.findMany({
    where: keywordWhere,
    select: { id: true, youtubeId: true },
  });
  const keywordIds = keywordRows.map((row) => row.id);

  const semanticHits = await searchVectorIndex(query, { topK: 48, maxPerVideo: MAX_HITS_PER_VIDEO });
  const semanticByYoutube = new Map<string, SemanticHit[]>();
  for (const hit of semanticHits) {
    const list = semanticByYoutube.get(hit.youtubeId) ?? [];
    list.push(hit);
    semanticByYoutube.set(hit.youtubeId, list);
  }

  const orClauses: Prisma.VideoWhereInput[] = [];
  if (keywordIds.length) orClauses.push({ id: { in: keywordIds } });
  if (semanticByYoutube.size) orClauses.push({ youtubeId: { in: [...semanticByYoutube.keys()] } });
  if (orClauses.length === 0) {
    return { ...emptyPage(requestedPage), semanticError: lastVectorSearchError() };
  }

  const where: Prisma.VideoWhereInput = {
    AND: [filterWhere, { OR: orClauses }],
  };

  const videos = await prisma.video.findMany({ where });
  if (videos.length === 0) {
    return {
      ...emptyPage(requestedPage),
      semanticUsed: semanticHits.length > 0,
      semanticError: lastVectorSearchError(),
    };
  }

  const semanticStartMs = [...new Set(semanticHits.map((hit) => hit.startMs))];
  const segments = await prisma.transcriptSegment.findMany({
    where: {
      videoId: { in: videos.map((video) => video.id) },
      OR: [
        { text: containsFilter(query) },
        ...(semanticStartMs.length ? [{ startMs: { in: semanticStartMs } }] : []),
      ],
    },
    orderBy: { startMs: "asc" },
  });

  const segmentsByVideo = new Map<string, typeof segments>();
  for (const segment of segments) {
    const list = segmentsByVideo.get(segment.videoId) ?? [];
    list.push(segment);
    segmentsByVideo.set(segment.videoId, list);
  }

  const ranked = videos.map((video) => {
    const videoSegments = segmentsByVideo.get(video.id) ?? [];
    const keywordSegments = videoSegments.filter((segment) =>
      segment.text.toLowerCase().includes(query.toLowerCase()),
    );
    const semantic = semanticByYoutube.get(video.youtubeId) ?? [];
    const mapped = mapVideoBase(video);
    const hits = mergeHits(keywordSegments, semantic, videoSegments);
    return {
      ...mapped,
      hits,
      score: scoreVideo(mapped, query, keywordSegments.length, semantic),
    };
  });

  ranked.sort((left, right) => {
    const scoreDelta = (right.score ?? 0) - (left.score ?? 0);
    if (Math.abs(scoreDelta) > 0.001) return scoreDelta;
    return right.publishedAt.getTime() - left.publishedAt.getTime();
  });

  const total = ranked.length;
  const pageCount = Math.max(1, Math.ceil(total / LIBRARY_PAGE_SIZE));
  const page = Math.min(requestedPage, pageCount);
  const start = (page - 1) * LIBRARY_PAGE_SIZE;

  return {
    total,
    page,
    pageSize: LIBRARY_PAGE_SIZE,
    pageCount,
    semanticUsed: semanticHits.length > 0,
    semanticError: lastVectorSearchError(),
    results: ranked.slice(start, start + LIBRARY_PAGE_SIZE),
  };
}

export async function listFilterOptions() {
  const videos = await prisma.video.findMany({
    select: { speakers: true, topics: true, publishedAt: true, programs: true },
  });

  const speakers = new Set<string>();
  const topics = new Set<string>();
  const years = new Set<number>();

  for (const video of videos) {
    parseJsonArray(video.speakers).forEach((speaker) => speakers.add(speaker));
    parseJsonArray(video.topics).forEach((topic) => topics.add(topic));
    years.add(video.publishedAt.getUTCFullYear());
  }

  return {
    speakers: [...speakers].sort((a, b) => a.localeCompare(b)),
    topics: [...topics].sort((a, b) => a.localeCompare(b)),
    years: [...years].sort((a, b) => b - a),
  };
}
