import type { Prisma } from "@prisma/client";
import { isBrowseId, videoMatchesBrowse } from "@/lib/browse";
import { prisma } from "@/lib/db";
import { parseJsonArray } from "@/lib/json";
import { isProgram } from "@/lib/programs";

export const LIBRARY_PAGE_SIZE = 24;

export type LibraryFilters = {
  q?: string;
  browse?: string;
  program?: string;
  speaker?: string;
  year?: string;
  topic?: string;
  page?: string;
};

export type TranscriptHit = {
  startMs: number;
  endMs: number | null;
  text: string;
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
  hits: TranscriptHit[];
};

export type LibrarySearchPage = {
  results: LibraryResult[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
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
    select: { id: true, title: true, displayTitle: true, programs: true, topics: true },
  });
  const ids = videos
    .filter((video) =>
      videoMatchesBrowse(browse, {
        title: video.title,
        displayTitle: video.displayTitle,
        programs: parseJsonArray(video.programs),
        topics: parseJsonArray(video.topics),
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

export async function searchLibrary(filters: LibraryFilters): Promise<LibrarySearchPage> {
  const query = filters.q?.trim() ?? "";
  const where = await videoWhere(filters);
  const total = await prisma.video.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / LIBRARY_PAGE_SIZE));
  const page = Math.min(parseLibraryPage(filters.page), pageCount);

  const videos = await prisma.video.findMany({
    where,
    orderBy: { publishedAt: "desc" },
    skip: (page - 1) * LIBRARY_PAGE_SIZE,
    take: LIBRARY_PAGE_SIZE,
    include: query
      ? {
          segments: {
            where: { text: containsFilter(query) },
            orderBy: { startMs: "asc" },
            take: 3,
          },
        }
      : { segments: false },
  });

  return {
    total,
    page,
    pageSize: LIBRARY_PAGE_SIZE,
    pageCount,
    results: videos.map((video) => ({
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
      hits:
        "segments" in video && Array.isArray(video.segments)
          ? video.segments.map((segment) => ({
              startMs: segment.startMs,
              endMs: segment.endMs,
              text: segment.text,
            }))
          : [],
    })),
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
