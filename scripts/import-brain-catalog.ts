import { readFile } from "node:fs/promises";
import path from "node:path";
import { gunzipSync } from "node:zlib";
import { PrismaClient } from "@prisma/client";
import {
  brainVideoRecord,
  chunkToSegment,
  type BrainChunk,
  type BrainVideo,
} from "../src/lib/brain-catalog";
import { loadDisplayTitleOverrides, loadSpeakerOverrides } from "../src/lib/display-title";
import { youtubeThumbnail } from "../src/lib/format";
import { toJsonArray } from "../src/lib/json";
import { readVectorIndexFile } from "../src/lib/vector-index";

const SEGMENT_BATCH = 200;
const VIDEO_BATCH = 25;

export const DEFAULT_VIDEOS_PATH = path.join(process.cwd(), "data/brain/videos.json");
export const DEFAULT_CHUNKS_GZ_PATH = path.join(process.cwd(), "data/brain/search_chunks.json.gz");
export const DEFAULT_CHUNKS_JSON_PATH = path.join(process.cwd(), "data/brain/search_chunks.json");

function argValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await readFile(filePath);
    return true;
  } catch {
    return false;
  }
}

async function loadJsonFile<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath);
  const text = filePath.endsWith(".gz") ? gunzipSync(raw).toString("utf8") : raw.toString("utf8");
  return JSON.parse(text) as T;
}

export async function resolveChunksPath(explicit?: string): Promise<string> {
  if (explicit) return path.resolve(explicit);
  if (await fileExists(DEFAULT_CHUNKS_GZ_PATH)) return DEFAULT_CHUNKS_GZ_PATH;
  if (await fileExists(DEFAULT_CHUNKS_JSON_PATH)) return DEFAULT_CHUNKS_JSON_PATH;
  throw new Error(
    `Brain search chunks not found. Add data/brain/search_chunks.json.gz (or .json).`,
  );
}

export async function importBrainCatalog(
  prisma: PrismaClient,
  options: { videosPath?: string; chunksPath?: string } = {},
) {
  const videosPath = path.resolve(options.videosPath ?? DEFAULT_VIDEOS_PATH);
  const chunksPath = await resolveChunksPath(options.chunksPath);

  const videosJson = await loadJsonFile<BrainVideo[]>(videosPath);
  const chunksJson = await loadJsonFile<BrainChunk[]>(chunksPath);

  if (!Array.isArray(videosJson) || videosJson.length === 0) {
    throw new Error(`No videos in ${videosPath}`);
  }
  if (!Array.isArray(chunksJson)) {
    throw new Error(`Search chunks must be an array: ${chunksPath}`);
  }

  const displayTitles = loadDisplayTitleOverrides();
  const speakerOverrides = loadSpeakerOverrides();
  const videos = videosJson.filter((video) => video?.video_id);
  const unlisted = videos.filter((video) => (video.visibility ?? "").toLowerCase() === "unlisted").length;
  const publicCount = videos.filter((video) => (video.visibility ?? "").toLowerCase() === "public").length;

  console.log(
    `Importing Brain catalog: ${videos.length} videos (${unlisted} unlisted, ${publicCount} public) from ${path.relative(process.cwd(), videosPath)}`,
  );
  console.log(`Display titles: ${Object.keys(displayTitles).length} curated overrides`);
  console.log(
    `Search chunks: ${chunksJson.length} from ${path.relative(process.cwd(), chunksPath)}`,
  );

  const youtubeToId = new Map<string, string>();

  for (let index = 0; index < videos.length; index += VIDEO_BATCH) {
    const batch = videos.slice(index, index + VIDEO_BATCH);
    await Promise.all(
      batch.map(async (video) => {
        const meta = brainVideoRecord(video, displayTitles, speakerOverrides);
        const { displayTitle, speakers } = meta;
        const record = await prisma.video.upsert({
          where: { youtubeId: meta.youtubeId },
          create: {
            youtubeId: meta.youtubeId,
            title: meta.title,
            displayTitle,
            description: meta.description,
            publishedAt: meta.publishedAt,
            durationSec: meta.durationSec,
            thumbnailUrl: youtubeThumbnail(meta.youtubeId),
            speakers: toJsonArray(speakers),
            programs: toJsonArray(meta.programs),
            topics: toJsonArray(meta.topics),
            recordingType: meta.recordingType,
            source: meta.source,
          },
          update: {
            title: meta.title,
            displayTitle,
            description: meta.description,
            publishedAt: meta.publishedAt,
            durationSec: meta.durationSec,
            thumbnailUrl: youtubeThumbnail(meta.youtubeId),
            speakers: toJsonArray(speakers),
            programs: toJsonArray(meta.programs),
            topics: toJsonArray(meta.topics),
            recordingType: meta.recordingType,
            source: meta.source,
          },
        });
        youtubeToId.set(meta.youtubeId, record.id);
      }),
    );
  }

  const keepIds = [...youtubeToId.values()];
  const removed = await prisma.video.deleteMany({
    where: { id: { notIn: keepIds } },
  });
  if (removed.count) {
    console.log(`Removed ${removed.count} videos that were not in the Brain export (old demo rows).`);
  }

  await prisma.transcriptSegment.deleteMany();

  const segmentRows = [];
  let skippedUnknown = 0;
  let skippedEmpty = 0;
  for (const chunk of chunksJson) {
    const videoId = youtubeToId.get(chunk.video_id);
    if (!videoId) {
      skippedUnknown += 1;
      continue;
    }
    const segment = chunkToSegment(chunk);
    if (!segment.text) {
      skippedEmpty += 1;
      continue;
    }
    segmentRows.push({
      videoId,
      startMs: segment.startMs,
      endMs: segment.endMs,
      text: segment.text,
    });
  }

  for (let index = 0; index < segmentRows.length; index += SEGMENT_BATCH) {
    await prisma.transcriptSegment.createMany({
      data: segmentRows.slice(index, index + SEGMENT_BATCH),
    });
  }

  const videoCount = await prisma.video.count();
  const segmentCount = await prisma.transcriptSegment.count();
  console.log(
    `Brain catalog ready: ${videoCount} videos, ${segmentCount} transcript chunks` +
      (skippedUnknown || skippedEmpty
        ? ` (skipped ${skippedUnknown} unknown-video chunks, ${skippedEmpty} empty).`
        : "."),
  );

  try {
    const index = readVectorIndexFile();
    if (index.sourceChunkCount !== chunksJson.length) {
      console.warn(
        `Embeddings look stale (index source chunks ${index.sourceChunkCount} vs export ${chunksJson.length}). Run npm run brain:embed.`,
      );
    } else {
      console.log(
        `Embeddings: ${index.chunkCount} windows (${index.provider}) ready for hybrid /library search.`,
      );
    }
  } catch {
    console.warn("No embeddings index yet. Hybrid search is keyword-only until npm run brain:embed.");
  }

  return { videoCount, segmentCount, unlisted, publicCount };
}

async function main() {
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "file:./dev.db";
  }

  const prisma = new PrismaClient();
  try {
    await importBrainCatalog(prisma, {
      videosPath: argValue("--videos"),
      chunksPath: argValue("--chunks"),
    });
  } finally {
    await prisma.$disconnect();
  }
}

const invokedDirectly = process.argv[1]?.includes("import-brain-catalog");
if (invokedDirectly) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
