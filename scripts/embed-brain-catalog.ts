import { readFile } from "node:fs/promises";
import path from "node:path";
import { gunzipSync } from "node:zlib";
import {
  chunkToSegment,
  metadataForBrainVideo,
  type BrainChunk,
  type BrainVideo,
} from "../src/lib/brain-catalog";
import { loadDisplayTitleOverrides, loadSpeakerOverrides, resolveDisplayTitle } from "../src/lib/display-title";
import {
  computeIdf,
  embedTokens,
  EMBED_DIM,
  EMBED_PROVIDER,
  EMBED_VERSION,
  expandForEmbed,
  idfToPairs,
  int8ToBase64,
  mixVectors,
  quantizeInt8,
  tokenize,
} from "../src/lib/embed";
import { DEFAULT_EMBEDDINGS_PATH, writeVectorIndexFile } from "../src/lib/vector-index";
import { extractSpeakers, mergeSpeakers } from "../src/lib/classify";
import { publicTitle } from "../src/lib/format";

const DEFAULT_VIDEOS_PATH = path.join(process.cwd(), "data/brain/videos.json");
const DEFAULT_CHUNKS_GZ_PATH = path.join(process.cwd(), "data/brain/search_chunks.json.gz");
const DEFAULT_CHUNKS_JSON_PATH = path.join(process.cwd(), "data/brain/search_chunks.json");

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

async function resolveChunksPath(explicit?: string): Promise<string> {
  if (explicit) return path.resolve(explicit);
  if (await fileExists(DEFAULT_CHUNKS_GZ_PATH)) return DEFAULT_CHUNKS_GZ_PATH;
  if (await fileExists(DEFAULT_CHUNKS_JSON_PATH)) return DEFAULT_CHUNKS_JSON_PATH;
  throw new Error("Brain search chunks not found. Add data/brain/search_chunks.json.gz.");
}

function contextPrefix(title: string, speakers: string[]): string {
  const speakerText = speakers.filter(Boolean).join(", ");
  return speakerText ? `${title}. ${speakerText}.` : `${title}.`;
}

export async function embedBrainCatalog(options: {
  videosPath?: string;
  chunksPath?: string;
  outPath?: string;
} = {}) {
  const videosPath = path.resolve(options.videosPath ?? DEFAULT_VIDEOS_PATH);
  const chunksPath = await resolveChunksPath(options.chunksPath);
  const outPath = path.resolve(options.outPath ?? DEFAULT_EMBEDDINGS_PATH);

  const videosJson = await loadJsonFile<BrainVideo[]>(videosPath);
  const chunksJson = await loadJsonFile<BrainChunk[]>(chunksPath);
  const displayTitles = loadDisplayTitleOverrides();
  const speakerOverrides = loadSpeakerOverrides();

  const metaByYoutubeId = new Map<
    string,
    { title: string; speakers: string[] }
  >();
  for (const video of videosJson) {
    if (!video?.video_id) continue;
    const meta = metadataForBrainVideo(video);
    const displayTitle = resolveDisplayTitle(
      meta.youtubeId,
      meta.title,
      meta.publishedAt,
      displayTitles,
    );
    const speakers = mergeSpeakers(
      meta.speakers,
      displayTitle ? extractSpeakers(displayTitle) : [],
      speakerOverrides[meta.youtubeId],
    );
    metaByYoutubeId.set(meta.youtubeId, {
      title: publicTitle({ title: meta.title, displayTitle }),
      speakers,
    });
  }

  type Prepared = {
    youtubeId: string;
    startMs: number;
    endMs: number;
    bodyTokens: string[];
    titleTokens: string[];
  };

  const prepared: Prepared[] = [];
  let skippedUnknown = 0;
  let skippedEmpty = 0;
  const byVideo = new Map<string, BrainChunk[]>();

  for (const chunk of chunksJson) {
    if (!metaByYoutubeId.has(chunk.video_id)) {
      skippedUnknown += 1;
      continue;
    }
    const list = byVideo.get(chunk.video_id) ?? [];
    list.push(chunk);
    byVideo.set(chunk.video_id, list);
  }

  for (const [youtubeId, rawChunks] of byVideo) {
    const meta = metaByYoutubeId.get(youtubeId);
    if (!meta) continue;
    const prefix = contextPrefix(meta.title, meta.speakers);
    const ordered = [...rawChunks].sort((a, b) => a.start_sec - b.start_sec);

    for (const chunk of ordered) {
      const segment = chunkToSegment(chunk);
      if (!segment.text) {
        skippedEmpty += 1;
        continue;
      }
      prepared.push({
        youtubeId,
        startMs: segment.startMs,
        endMs: segment.endMs,
        bodyTokens: tokenize(expandForEmbed(segment.text)),
        titleTokens: tokenize(expandForEmbed(prefix)),
      });
    }
  }

  console.log(
    `Embedding ${prepared.length} windows from ${chunksJson.length} ASR chunks ` +
      `(${metaByYoutubeId.size} videos; skipped ${skippedUnknown} unknown, ${skippedEmpty} empty).`,
  );

  const idf = computeIdf(prepared.map((item) => [...item.bodyTokens, ...item.titleTokens]));
  const chunks: Array<[string, number, number, string]> = prepared.map((item) => {
    const body = embedTokens(item.bodyTokens, idf, EMBED_DIM);
    const title = embedTokens(item.titleTokens, idf, EMBED_DIM);
    const vector = quantizeInt8(mixVectors(body, title, 0.82));
    return [item.youtubeId, item.startMs, item.endMs, int8ToBase64(vector)];
  });

  writeVectorIndexFile(outPath, {
    version: EMBED_VERSION,
    provider: EMBED_PROVIDER,
    dim: EMBED_DIM,
    builtAt: new Date().toISOString(),
    chunkCount: chunks.length,
    sourceChunkCount: chunksJson.length,
    idf: idfToPairs(idf),
    chunks,
  });

  console.log(
    `Wrote ${path.relative(process.cwd(), outPath)} · provider=${EMBED_PROVIDER} · dim=${EMBED_DIM} · $0 API cost`,
  );
  return { chunkCount: chunks.length, sourceChunkCount: chunksJson.length, outPath };
}

async function main() {
  await embedBrainCatalog({
    videosPath: argValue("--videos"),
    chunksPath: argValue("--chunks"),
    outPath: argValue("--out"),
  });
}

const invokedDirectly = process.argv[1]?.includes("embed-brain-catalog");
if (invokedDirectly) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
