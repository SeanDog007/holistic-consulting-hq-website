export function formatDuration(totalSec: number): string {
  if (!Number.isFinite(totalSec) || totalSec <= 0) return "";
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = Math.floor(totalSec % 60);
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function formatTimestamp(ms: number): string {
  return formatDuration(Math.max(0, Math.floor(ms / 1000)));
}

export function formatPublishedDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function yearFromDate(date: Date): number {
  return date.getUTCFullYear();
}

export function youtubeThumbnail(youtubeId: string): string {
  return `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
}

export function youtubeWatchUrl(youtubeId: string, startSec = 0): string {
  const base = `https://www.youtube.com/watch?v=${youtubeId}`;
  const seconds = Math.floor(startSec);
  if (!Number.isFinite(seconds) || seconds <= 0) return base;
  return `${base}&t=${seconds}s`;
}

export function highlightMatch(text: string, query: string): string {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.replace(new RegExp(escaped, "ig"), (match) => `{{{${match}}}}`);
}
