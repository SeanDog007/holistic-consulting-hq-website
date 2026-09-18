import { classifyPrograms, classifyTopics, extractSpeakers } from "./classify";
import { PROGRAMS, type Program } from "./programs";

export type BrainVideo = {
  video_id: string;
  title: string;
  visibility?: string | null;
  published_at: string;
  duration_sec: number;
  youtube_url?: string;
  caption_source?: string | null;
  ingest_status?: string | null;
  has_manual_captions_en?: number;
  program?: string | null;
};

export type BrainChunk = {
  video_id: string;
  start_sec: number;
  end_sec: number;
  text: string;
};

const PROGRAM_ALIASES: Record<string, Program> = {
  mentorship: "Mentorship",
  herbal: "Herbalism",
  herbalism: "Herbalism",
  bchn: "BCHN",
  other: "Other",
  community: "Community",
  business: "Business",
  "office hours": "Office Hours",
  office_hours: "Office Hours",
  officehours: "Office Hours",
};

export function mapBrainProgram(value: string | null | undefined): Program | null {
  if (!value?.trim()) return null;
  const key = value.trim().toLowerCase();
  if (PROGRAM_ALIASES[key]) return PROGRAM_ALIASES[key];
  if ((PROGRAMS as readonly string[]).includes(value.trim())) {
    return value.trim() as Program;
  }
  return null;
}

export function programsForBrainVideo(
  title: string,
  program: string | null | undefined,
): Program[] {
  const found = new Set<Program>(classifyPrograms(title));
  const mapped = mapBrainProgram(program);
  if (mapped) {
    found.delete("Other");
    found.add(mapped);
  }
  if (found.size === 0) found.add("Other");
  return PROGRAMS.filter((item) => found.has(item));
}

export function parseBrainDate(value: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T16:00:00.000Z`);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export function metadataForBrainVideo(video: BrainVideo) {
  const title = video.title?.trim() || "Untitled recording";
  return {
    youtubeId: video.video_id,
    title,
    description: "",
    publishedAt: parseBrainDate(video.published_at),
    durationSec: Math.max(0, Math.round(Number(video.duration_sec) || 0)),
    speakers: extractSpeakers(title),
    programs: programsForBrainVideo(title, video.program),
    topics: classifyTopics(title),
    visibility: video.visibility?.trim() || "Unlisted",
    source: "brain" as const,
  };
}

export function chunkToSegment(chunk: BrainChunk) {
  const startMs = Math.max(0, Math.round(Number(chunk.start_sec) * 1000));
  const endRaw = Math.round(Number(chunk.end_sec) * 1000);
  const endMs = Number.isFinite(endRaw) ? Math.max(startMs, endRaw) : startMs;
  return {
    startMs,
    endMs,
    text: String(chunk.text ?? "").replace(/\s+/g, " ").trim(),
  };
}
