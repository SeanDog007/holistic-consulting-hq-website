import { canonicalSpeaker, classifyPrograms, classifyTopics, extractSpeakers, mergeSpeakers } from "./classify";
import { resolveDisplayTitle } from "./display-title";
import { PROGRAMS, type Program } from "./programs";

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

/**
 * Series labels from the Brain export that already match a library program.
 * Clinical series stay on title/topic matching so Mentorship is not over-applied.
 */
const SERIES_PROGRAMS: Record<string, readonly Program[]> = {
  herbalism: ["Herbalism"],
  bchn: ["BCHN"],
  nanp: ["BCHN"],
  "business mastermind": ["Business"],
  "business & career": ["Business"],
  "finding your first client": ["Business"],
  "career roundtable": ["Business"],
  "new graduate roundtable": ["Office Hours"],
  "community live": ["Community"],
  "program orientation": ["Community"],
  "member roundtable": ["Community"],
  "member stories": ["Community"],
  "grand rounds": ["Community"],
  "clinical roundtable": ["Community"],
  "case roundtable": ["Community"],
  "journal roundtable": ["Community"],
};

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
): Program[] {
  const found = new Set<Program>(classifyPrograms(title));
  const mapped = mapBrainProgram(program);
  if (mapped) {
    found.delete("Other");
    found.add(mapped);
  }
  for (const item of SERIES_PROGRAMS[series?.trim().toLowerCase() ?? ""] ?? []) {
    found.delete("Other");
    found.add(item);
  }
  if (found.size === 0) found.add("Other");
  return PROGRAMS.filter((item) => found.has(item));
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
  return {
    ...meta,
    displayTitle,
    speakers: speakersForBrainVideo(video, meta.title, displayTitle, speakerOverrides),
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
