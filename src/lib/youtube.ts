import { classifyPrograms, classifyTopics, extractSpeakers } from "@/lib/classify";
import { youtubeThumbnail } from "@/lib/format";

export type TimedCue = {
  startMs: number;
  endMs?: number;
  text: string;
};

export type IngestedVideo = {
  youtubeId: string;
  title: string;
  description: string;
  publishedAt: Date;
  durationSec: number;
  thumbnailUrl: string;
  speakers: string[];
  programs: string[];
  topics: string[];
  source: "youtube";
  cues: TimedCue[];
};

export function parseIsoDuration(iso: string | undefined): number {
  if (!iso) return 0;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return Number(match[1] || 0) * 3600 + Number(match[2] || 0) * 60 + Number(match[3] || 0);
}

function extractJsonObject(html: string, marker: string): unknown | null {
  const idx = html.indexOf(marker);
  if (idx === -1) return null;
  const start = html.indexOf("{", idx);
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < html.length; i += 1) {
    const char = html[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }
    if (char === '"') {
      inString = true;
      continue;
    }
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        try {
          return JSON.parse(html.slice(start, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

type CaptionTrack = {
  baseUrl?: string;
  languageCode?: string;
  kind?: string;
};

export async function fetchCaptionCues(youtubeId: string): Promise<TimedCue[]> {
  const watchUrl = `https://www.youtube.com/watch?v=${youtubeId}`;
  const html = await fetch(watchUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
    },
  }).then((response) => response.text());

  const player = extractJsonObject(html, "ytInitialPlayerResponse") as {
    captions?: {
      playerCaptionsTracklistRenderer?: {
        captionTracks?: CaptionTrack[];
      };
    };
  } | null;

  const tracks = player?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
  if (!tracks.length) return [];

  const preferred =
    tracks.find((track) => track.languageCode?.startsWith("en") && track.kind !== "asr") ??
    tracks.find((track) => track.languageCode?.startsWith("en")) ??
    tracks[0];

  if (!preferred?.baseUrl) return [];

  const timedUrl = preferred.baseUrl.includes("fmt=")
    ? preferred.baseUrl
    : `${preferred.baseUrl}${preferred.baseUrl.includes("?") ? "&" : "?"}fmt=json3`;

  const json = (await fetch(timedUrl).then((response) => response.json())) as {
    events?: Array<{ tStartMs?: number; dDurationMs?: number; segs?: Array<{ utf8?: string }> }>;
  };

  const raw: TimedCue[] = [];
  for (const event of json.events ?? []) {
    const text = (event.segs ?? [])
      .map((seg) => seg.utf8 ?? "")
      .join("")
      .replace(/\s+/g, " ")
      .trim();
    if (!text || text === "\n") continue;
    raw.push({
      startMs: event.tStartMs ?? 0,
      endMs: event.tStartMs != null && event.dDurationMs != null ? event.tStartMs + event.dDurationMs : undefined,
      text,
    });
  }

  return mergeCues(raw);
}

export function mergeCues(cues: TimedCue[], windowMs = 9000): TimedCue[] {
  if (!cues.length) return [];
  const merged: TimedCue[] = [];
  let current: TimedCue | null = null;

  for (const cue of cues) {
    if (!current) {
      current = { ...cue };
      continue;
    }
    const currentEnd = current.endMs ?? current.startMs;
    const tooLong = cue.startMs - current.startMs >= windowMs;
    const sentenceBreak = /[.!?]$/.test(current.text.trim());
    if (tooLong && (sentenceBreak || current.text.length > 80)) {
      merged.push(current);
      current = { ...cue };
    } else {
      current.text = `${current.text} ${cue.text}`.replace(/\s+/g, " ").trim();
      current.endMs = cue.endMs ?? currentEnd;
    }
  }
  if (current) merged.push(current);
  return merged;
}

type YoutubeVideoResource = {
  id: string;
  snippet?: {
    title?: string;
    description?: string;
    publishedAt?: string;
    thumbnails?: { high?: { url?: string }; medium?: { url?: string } };
  };
  contentDetails?: { duration?: string };
};

export function mapYoutubeVideo(resource: YoutubeVideoResource, cues: TimedCue[] = []): IngestedVideo {
  const title = resource.snippet?.title ?? "Untitled recording";
  const description = resource.snippet?.description ?? "";
  return {
    youtubeId: resource.id,
    title,
    description,
    publishedAt: new Date(resource.snippet?.publishedAt ?? Date.now()),
    durationSec: parseIsoDuration(resource.contentDetails?.duration),
    thumbnailUrl:
      resource.snippet?.thumbnails?.high?.url ??
      resource.snippet?.thumbnails?.medium?.url ??
      youtubeThumbnail(resource.id),
    speakers: extractSpeakers(title, description),
    programs: classifyPrograms(title, description),
    topics: classifyTopics(title, description),
    source: "youtube",
    cues,
  };
}

export async function fetchChannelUploads(apiKey: string, handle: string): Promise<YoutubeVideoResource[]> {
  const normalized = handle.replace(/^@/, "");
  const channelUrl = new URL("https://www.googleapis.com/youtube/v3/channels");
  channelUrl.searchParams.set("part", "contentDetails");
  channelUrl.searchParams.set("forHandle", normalized);
  channelUrl.searchParams.set("key", apiKey);

  const channelJson = (await fetch(channelUrl).then((response) => response.json())) as {
    items?: Array<{ contentDetails?: { relatedPlaylists?: { uploads?: string } } }>;
    error?: { message?: string };
  };

  const uploadsId = channelJson.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsId) {
    throw new Error(channelJson.error?.message ?? `Could not resolve uploads playlist for @${normalized}`);
  }

  const videoIds: string[] = [];
  let pageToken = "";
  do {
    const playlistUrl = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
    playlistUrl.searchParams.set("part", "contentDetails");
    playlistUrl.searchParams.set("playlistId", uploadsId);
    playlistUrl.searchParams.set("maxResults", "50");
    playlistUrl.searchParams.set("key", apiKey);
    if (pageToken) playlistUrl.searchParams.set("pageToken", pageToken);

    const playlistJson = (await fetch(playlistUrl).then((response) => response.json())) as {
      items?: Array<{ contentDetails?: { videoId?: string } }>;
      nextPageToken?: string;
    };
    for (const item of playlistJson.items ?? []) {
      if (item.contentDetails?.videoId) videoIds.push(item.contentDetails.videoId);
    }
    pageToken = playlistJson.nextPageToken ?? "";
  } while (pageToken);

  const videos: YoutubeVideoResource[] = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const videosUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
    videosUrl.searchParams.set("part", "snippet,contentDetails");
    videosUrl.searchParams.set("id", batch.join(","));
    videosUrl.searchParams.set("key", apiKey);
    const videosJson = (await fetch(videosUrl).then((response) => response.json())) as {
      items?: YoutubeVideoResource[];
    };
    videos.push(...(videosJson.items ?? []));
  }

  return videos;
}
