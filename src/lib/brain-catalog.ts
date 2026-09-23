import { canonicalSpeaker, classifyTopics, extractSpeakers, mergeSpeakers } from "./classify";
import { resolveDisplayTitle } from "./display-title";
import { PROGRAMS, type Program } from "./programs";
import { taxonomyForBrainVideo } from "./taxonomy";

export type BrainVideo = {
  video_id: string;
  title: string;
  /** YouTube / Studio title when `title` is the Brain display title. */
  rawTitle?: string | null;
  visibility?: string | null;
  published_at: string;
  duration_sec: number;
  youtube_url?: string;
  caption_source?: string | null;
  ingest_status?: string | null;
  has_manual_captions_en?: number;
  program?: string | null;
  series?: string | null;
  speaker?: string | null;
  speaker_credentials?: string | null;
};

export type BrainChunk = {
  video_id: string;
  start_sec: number;
  end_sec: number;
  text: string;
};

/**
 * @deprecated Brain `mentorship` is not a curriculum program. Prefer `programsFor`.
 * Kept so older call sites can still recognize the four curriculum labels and
 * the herbal / BCHN export values.
 */
const PROGRAM_ALIASES: Record<string, Program> = {
  herbal: "Herbalism",
  herbalism: "Herbalism",
  bchn: "BCHN Exam Prep",
  "functional nutrition mentorship": "Functional Nutrition Mentorship",
  "bchn exam prep": "BCHN Exam Prep",
  "business mentorship": "Business Mentorship",
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

const SERIES_TOPICS: Record<string, readonly string[]> = {
  "gi & microbiome": ["digestive health", "microbiome"],
  "microbiome & sporebiotics": ["microbiome"],
  "functional testing": ["functional testing"],
  bchn: ["BCHN"],
  nanp: ["BCHN"],
};

export function programsForBrainVideo(
  title: string,
  program: string | null | undefined,
  series?: string | null,
  displayTitle?: string | null,
): Program[] {
  return taxonomyForBrainVideo({
    title,
    displayTitle,
    series,
    brainProgram: program,
  }).programs;
}

export function topicsForBrainVideo(title: string, series?: string | null): string[] {
  const topics = classifyTopics(title);
  for (const topic of SERIES_TOPICS[series?.trim().toLowerCase() ?? ""] ?? []) {
    if (!topics.includes(topic)) topics.push(topic);
  }
  return topics;
}

/** Studio title. Brain display titles live in `title` when `rawTitle` is set. */
export function youtubeTitleForBrainVideo(video: BrainVideo): string {
  const raw = video.rawTitle?.trim();
  if (raw) return raw;
  return video.title?.trim() || "Untitled recording";
}

/** Display title shipped on the export, when it differs from the YouTube title. */
export function exportDisplayTitle(video: BrainVideo): string | null {
  const raw = video.rawTitle?.trim();
  const title = video.title?.trim();
  if (!raw || !title || title === raw) return null;
  return title;
}

export function resolveBrainDisplayTitle(
  video: BrainVideo,
  publishedAt: Date,
  overrides: Record<string, string>,
): string | null {
  return (
    exportDisplayTitle(video) ??
    resolveDisplayTitle(video.video_id, youtubeTitleForBrainVideo(video), publishedAt, overrides)
  );
}

export function formatCatalogSpeaker(
  speaker: string | null | undefined,
  credentials: string | null | undefined,
): string | null {
  const name = speaker?.trim();
  if (!name) return null;
  const canonical = canonicalSpeaker(name);
  const creds = credentials?.trim();
  if (!creds || canonical.toLowerCase().includes(creds.toLowerCase())) return canonical;
  return `${canonical}, ${creds}`;
}

export function speakersForBrainVideo(
  video: BrainVideo,
  youtubeTitle: string,
  displayTitle: string | null,
  speakerOverrides: Record<string, string>,
): string[] {
  const formatted = formatCatalogSpeaker(video.speaker, video.speaker_credentials);
  const merged = mergeSpeakers(
    extractSpeakers(youtubeTitle),
    displayTitle ? extractSpeakers(displayTitle) : [],
    speakerOverrides[video.video_id],
    formatted,
  );
  if (!formatted || !video.speaker?.trim()) return merged;
  const bare = canonicalSpeaker(video.speaker.trim()).toLowerCase();
  if (formatted.toLowerCase() === bare) return merged;
  return merged.filter((name) => name.toLowerCase() !== bare);
}

export function parseBrainDate(value: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T16:00:00.000Z`);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export function metadataForBrainVideo(video: BrainVideo) {
  const title = youtubeTitleForBrainVideo(video);
  return {
    youtubeId: video.video_id,
    title,
    description: "",
    publishedAt: parseBrainDate(video.published_at),
    durationSec: Math.max(0, Math.round(Number(video.duration_sec) || 0)),
    speakers: extractSpeakers(title),
    programs: programsForBrainVideo(title, video.program, video.series),
    topics: topicsForBrainVideo(title, video.series),
    visibility: video.visibility?.trim() || "Unlisted",
    captionSource: video.caption_source?.trim() || null,
    ingestStatus: video.ingest_status?.trim() || null,
    series: video.series?.trim() || null,
    source: "brain" as const,
  };
}

export function brainVideoRecord(
  video: BrainVideo,
  displayTitleOverrides: Record<string, string>,
  speakerOverrides: Record<string, string>,
) {
  const meta = metadataForBrainVideo(video);
  const displayTitle = resolveBrainDisplayTitle(video, meta.publishedAt, displayTitleOverrides);
  const taxonomy = taxonomyForBrainVideo({
    title: meta.title,
    displayTitle,
    description: meta.description,
    series: video.series,
    brainProgram: video.program,
  });
  return {
    ...meta,
    displayTitle,
    speakers: speakersForBrainVideo(video, meta.title, displayTitle, speakerOverrides),
    programs: taxonomy.programs,
    recordingType: taxonomy.recordingType,
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
