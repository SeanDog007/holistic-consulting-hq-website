import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { publicTitle } from "./format";

export { publicTitle };

export const DEFAULT_DISPLAY_TITLES_DIR = path.join(process.cwd(), "data/brain");

export const DEFAULT_DISPLAY_TITLES_PATH = path.join(
  DEFAULT_DISPLAY_TITLES_DIR,
  "display-titles.json",
);

export const DEFAULT_BATCH_TITLES_PATH = path.join(
  DEFAULT_DISPLAY_TITLES_DIR,
  "display-titles.batch-1.json",
);

type BatchItem = {
  video_id?: string;
  display_title?: string;
  speaker?: string | null;
};

export type DisplayTitleBatchFile = {
  file: string;
  batch: number;
  titles: Record<string, string>;
  speakers: Record<string, string>;
};

function collectOverrides(parsed: unknown): Record<string, string> {
  const overrides: Record<string, string> = {};
  if (!parsed || typeof parsed !== "object") return overrides;

  const record = parsed as Record<string, unknown>;
  if (Array.isArray(record.items)) {
    for (const item of record.items as BatchItem[]) {
      const id = item.video_id?.trim();
      const title = item.display_title?.trim();
      if (id && title) overrides[id] = title;
    }
    return overrides;
  }

  for (const [key, value] of Object.entries(record)) {
    if (key.startsWith("_")) continue;
    if (typeof value === "string" && value.trim()) {
      overrides[key] = value.trim();
    }
  }
  return overrides;
}

function collectSpeakers(parsed: unknown): Record<string, string> {
  const speakers: Record<string, string> = {};
  if (!parsed || typeof parsed !== "object") return speakers;

  const record = parsed as Record<string, unknown>;
  if (!Array.isArray(record.items)) return speakers;

  for (const item of record.items as BatchItem[]) {
    const id = item.video_id?.trim();
    const speaker = item.speaker?.trim();
    if (id && speaker) speakers[id] = speaker;
  }
  return speakers;
}

function parseBatchNumber(fileName: string): number | null {
  const match = fileName.match(/^display-titles\.batch-(\d+)\.json$/);
  return match ? Number(match[1]) : null;
}

export function listDisplayTitleBatchFiles(
  dir = DEFAULT_DISPLAY_TITLES_DIR,
): DisplayTitleBatchFile[] {
  let names: string[] = [];
  try {
    names = readdirSync(dir);
  } catch {
    return [];
  }

  return names
    .map((name) => {
      const batch = parseBatchNumber(name);
      if (batch == null) return null;
      const file = path.join(dir, name);
      const parsed = readJsonFile(file);
      return {
        file,
        batch,
        titles: collectOverrides(parsed),
        speakers: collectSpeakers(parsed),
      };
    })
    .filter((item): item is DisplayTitleBatchFile => item !== null)
    .sort((a, b) => a.batch - b.batch);
}

export function formatSeriesDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function expandYear(year: number): number {
  if (year >= 100) return year;
  return year >= 70 ? 1900 + year : 2000 + year;
}

function utcDate(year: number, month: number, day: number): Date | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(expandYear(year), month - 1, day));
  if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date;
}

function parseLooseDate(year: string, month: string, day: string): Date | null {
  return utcDate(Number(year), Number(month), Number(day));
}

function firstDate(...candidates: Array<Date | null | undefined>): Date | null {
  return candidates.find((value): value is Date => value instanceof Date) ?? null;
}

export function inferSeriesDisplayTitle(title: string, publishedAt: Date): string | null {
  const trimmed = title.trim();
  if (!trimmed) return null;

  const isoMastermind = trimmed.match(
    /^Business Mastermind Call:\s*(\d{4})-(\d{2})-(\d{2})T/i,
  );
  if (isoMastermind) {
    const date = parseLooseDate(isoMastermind[1], isoMastermind[2], isoMastermind[3]);
    if (date) return `Business Mastermind — ${formatSeriesDate(date)}`;
  }

  if (/business mastermind/i.test(trimmed)) {
    const slash = trimmed.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
    if (slash) {
      const date = parseLooseDate(slash[3], slash[1], slash[2]);
      if (date) return `Business Mastermind — ${formatSeriesDate(date)}`;
    }
    const named = trimmed.match(
      /(?:call\s*[-–—:]\s*)?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})\s+(\d{4})/i,
    );
    if (named) {
      const months: Record<string, number> = {
        jan: 1,
        feb: 2,
        mar: 3,
        apr: 4,
        may: 5,
        jun: 6,
        jul: 7,
        aug: 8,
        sep: 9,
        oct: 10,
        nov: 11,
        dec: 12,
      };
      const date = utcDate(Number(named[3]), months[named[1].slice(0, 3).toLowerCase()], Number(named[2]));
      if (date) return `Business Mastermind — ${formatSeriesDate(date)}`;
    }
    const topic = trimmed
      .replace(/business mastermind(?:\s+call)?/gi, "")
      .replace(/\[recording\]/gi, "")
      .replace(/live/gi, "")
      .replace(/[-–—:.|[\]]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (topic && !/^\d/.test(topic) && topic.length < 60) {
      return `Business Mastermind — ${topic}`;
    }
    return `Business Mastermind — ${formatSeriesDate(publishedAt)}`;
  }

  if (/\bngr(?:\b|_)|nutritional grand rounds/i.test(trimmed)) {
    const iso = trimmed.match(/(\d{4})-(\d{2})-(\d{2})/);
    const slash = trimmed.match(/(\d{1,2})[/_-](\d{1,2})[/_-](\d{2,4})/);
    const spaced = trimmed.match(/\b(\d{1,2})\s+(\d{1,2})\s+(\d{2,4})\b/);
    const date = firstDate(
      iso ? parseLooseDate(iso[1], iso[2], iso[3]) : null,
      slash ? parseLooseDate(slash[3], slash[1], slash[2]) : null,
      spaced ? parseLooseDate(spaced[3], spaced[1], spaced[2]) : null,
      publishedAt,
    );
    if (date) return `New Graduate Roundtable — ${formatSeriesDate(date)}`;
  }

  const communityLive = trimmed.match(/^Community Live\s+(\d{8})$/i);
  if (communityLive) {
    const stamp = communityLive[1];
    const date =
      utcDate(Number(stamp.slice(4)), Number(stamp.slice(0, 2)), Number(stamp.slice(2, 4))) ??
      publishedAt;
    return `Community Live — ${formatSeriesDate(date)}`;
  }

  const roundtable = trimmed.match(
    /^(?:\d{4}\s+)?(Clinical|Case|Career|Journal|Member)\s+Roundtable(?:\s+(\d{1,2})[/_ ](\d{1,2})[/_ ](\d{2,4}))?/i,
  );
  if (roundtable) {
    const date = roundtable[2]
      ? parseLooseDate(roundtable[4], roundtable[2], roundtable[3])
      : publishedAt;
    const label = `${roundtable[1][0].toUpperCase()}${roundtable[1].slice(1).toLowerCase()} Roundtable`;
    if (date) return `${label} — ${formatSeriesDate(date)}`;
  }

  const pubmed = trimmed.match(/^PUBMED\s+(\d{1,2})\s+(\d{1,2})\s+(\d{2,4})$/i);
  if (pubmed) {
    const date = parseLooseDate(pubmed[3], pubmed[1], pubmed[2]);
    if (date) return `PubMed — ${formatSeriesDate(date)}`;
  }

  const liveCall = trimmed.match(/Live Call from\s+(\d{1,2})\/(\d{1,2})\/(\d{2,4})/i);
  if (liveCall) {
    const date = parseLooseDate(liveCall[3], liveCall[1], liveCall[2]);
    if (date) {
      const series = trimmed.replace(/\s+from\s+\d{1,2}\/\d{1,2}\/\d{2,4}/i, "").trim();
      return `${series} — ${formatSeriesDate(date)}`;
    }
  }

  const gmt = trimmed.match(/^GMT(\d{4})(\d{2})(\d{2})\b/);
  if (gmt) {
    const date = parseLooseDate(gmt[1], gmt[2], gmt[3]);
    if (date) return `Live Recording — ${formatSeriesDate(date)}`;
  }

  const qa = trimmed.match(/^(\d{2})-(\d{2})-(\d{4})\s+business Q&A lecture$/i);
  if (qa) {
    const date = parseLooseDate(qa[3], qa[1], qa[2]);
    if (date) return `Business Q&A — ${formatSeriesDate(date)}`;
  }

  return null;
}

function readJsonFile(filePath: string): unknown {
  try {
    return JSON.parse(readFileSync(filePath, "utf8")) as unknown;
  } catch {
    return null;
  }
}

function loadOverrideFile(filePath: string): Record<string, string> {
  return collectOverrides(readJsonFile(filePath));
}

/**
 * Keys are YouTube video ids (`Video.youtubeId`), not Prisma cuids.
 * Later official CoS batches win over earlier ones, and all batches win
 * over extra teaching polish in display-titles.json.
 *
 * Batches 1–10 cover the full catalog (batch 9 is Grand Rounds
 * `VXGZZirK56I`; batch 10 is `OjkzfeJz66o`). To add batch 11: drop
 * `data/brain/display-titles.batch-11.json` in the same
 * `{ items: [{ video_id, display_title, speaker? }] }` shape. No loader change.
 */
export function loadDisplayTitleOverrides(
  extrasPath = DEFAULT_DISPLAY_TITLES_PATH,
): Record<string, string> {
  const merged = { ...loadOverrideFile(extrasPath) };
  for (const batch of listDisplayTitleBatchFiles(path.dirname(extrasPath))) {
    Object.assign(merged, batch.titles);
  }
  return merged;
}

export function loadSpeakerOverrides(
  extrasPath = DEFAULT_DISPLAY_TITLES_PATH,
): Record<string, string> {
  const merged: Record<string, string> = {};
  for (const batch of listDisplayTitleBatchFiles(path.dirname(extrasPath))) {
    Object.assign(merged, batch.speakers);
  }
  return merged;
}

export function resolveDisplayTitle(
  youtubeId: string,
  title: string,
  publishedAt: Date,
  overrides: Record<string, string> = {},
): string | null {
  const override = overrides[youtubeId]?.trim();
  if (override) return override;
  const inferred = inferSeriesDisplayTitle(title, publishedAt);
  if (inferred && inferred !== title.trim()) return inferred;
  return null;
}
