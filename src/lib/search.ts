import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { parseJsonArray } from "@/lib/json";
import { isProgram } from "@/lib/programs";

export type LibraryFilters = {
  q?: string;
  program?: string;
  speaker?: string;
  year?: string;
  topic?: string;
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
  description: string;
  publishedAt: Date;
  durationSec: number;
  thumbnailUrl: string;
  speakers: string[];
  programs: string[];
  topics: string[];
  hits: TranscriptHit[];
};

function containsFilter(query: string): Prisma.StringFilter {
  return { contains: query };
}

export async function searchLibrary(filters: LibraryFilters): Promise<LibraryResult[]> {
  const query = filters.q?.trim() ?? "";
  const where: Prisma.VideoWhereInput = {};
  const and: Prisma.VideoWhereInput[] = [];

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
        { description: containsFilter(query) },
        { speakers: containsFilter(query) },
        { topics: containsFilter(query) },
        { segments: { some: { text: containsFilter(query) } } },
      ],
    });
  }
  if (and.length) where.AND = and;

  const videos = await prisma.video.findMany({
    where,
    orderBy: { publishedAt: "desc" },
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

  return videos.map((video) => ({
    id: video.id,
    youtubeId: video.youtubeId,
    title: video.title,
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
  }));
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
