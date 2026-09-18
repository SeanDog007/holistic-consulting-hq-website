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
  EMBED_VERSION,
  expandForEmbed,
  idfToPairs,
  int8ToBase64,
  MINILM_DIM,
  MINILM_PROVIDER,
  mixVectors,
  OPENAI_PROVIDER,
  providerDim,
  quantizeInt8,
  resolveEmbedProvider,
  TFIDF_PROVIDER,
  tokenize,
  type EmbedProviderId,
} from "../src/lib/embed";
import { DEFAULT_EMBEDDINGS_PATH, writeVectorIndexFile, type VectorIndex } from "../src/lib/vector-index";
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

export type PreparedWindow = {
  youtubeId: string;
  startMs: number;
  endMs: number;
  prefix: string;
  text: string;
  bodyTokens: string[];
  titleTokens: string[];
};

export async function loadPreparedWindows(options: {
  videosPath?: string;
  chunksPath?: string;
} = {}): Promise<{
  prepared: PreparedWindow[];
  sourceChunkCount: number;
  videoCount: number;
  skippedUnknown: number;
  skippedEmpty: number;
}> {
  const videosPath = path.resolve(options.videosPath ?? DEFAULT_VIDEOS_PATH);
  const chunksPath = await resolveChunksPath(options.chunksPath);
  const videosJson = await loadJsonFile<BrainVideo[]>(videosPath);
  const chunksJson = await loadJsonFile<BrainChunk[]>(chunksPath);
  const displayTitles = loadDisplayTitleOverrides();
  const speakerOverrides = loadSpeakerOverrides();

  const metaByYoutubeId = new Map<string, { title: string; speakers: string[] }>();
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

  const prepared: PreparedWindow[] = [];
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
        prefix,
        text: segment.text,
        bodyTokens: tokenize(expandForEmbed(segment.text)),
        titleTokens: tokenize(expandForEmbed(prefix)),
      });
    }
  }

  return {
    prepared,
    sourceChunkCount: chunksJson.length,
    videoCount: metaByYoutubeId.size,
    skippedUnknown,
    skippedEmpty,
  };
}

export function buildTfidfIndex(prepared: PreparedWindow[]): VectorIndex {
  const idf = computeIdf(prepared.map((item) => [...item.bodyTokens, ...item.titleTokens]));
  const chunks = prepared.map((item) => {
    const body = embedTokens(item.bodyTokens, idf, EMBED_DIM);
    const title = embedTokens(item.titleTokens, idf, EMBED_DIM);
    return {
      youtubeId: item.youtubeId,
      startMs: item.startMs,
      endMs: item.endMs,
      vector: quantizeInt8(mixVectors(body, title, 0.82)),
    };
  });
  return {
    version: EMBED_VERSION,
    provider: TFIDF_PROVIDER,
    dim: EMBED_DIM,
    builtAt: new Date().toISOString(),
    chunkCount: chunks.length,
    sourceChunkCount: prepared.length,
    idf,
    chunks,
  };
}

async function embedNeuralWindows(
  provider: EmbedProviderId,
  prepared: PreparedWindow[],
): Promise<Array<[string, number, number, string]>> {
  const texts = prepared.map((item) => `${item.prefix} ${item.text}`);
  let vectors: Float32Array[] = [];

  if (provider === OPENAI_PROVIDER) {
    const { embedOpenAI, estimateOpenAIEmbedCostUsd } = await import("../src/lib/embed-openai");
    const chars = texts.reduce((sum, text) => sum + text.length, 0);
    console.log(
      `OpenAI ${process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small"} · ` +
        `${texts.length} windows · ~${Math.ceil(chars / 4).toLocaleString()} tokens · ` +
        `est. $${estimateOpenAIEmbedCostUsd(chars).toFixed(3)}`,
    );
    vectors = await embedOpenAI(texts, { dimensions: providerDim(provider) });
  } else {
    const { embedMiniLM, ensureMiniLMModel } = await import("../src/lib/embed-minilm");
    await ensureMiniLMModel();
    console.log(`MiniLM ${texts.length} windows (local, $0). This may take several minutes on CPU.`);
    const started = Date.now();
    const batchLogEvery = 480;
    vectors = [];
    const batchSize = 24;
    for (let start = 0; start < texts.length; start += batchSize) {
      const batch = texts.slice(start, start + batchSize);
      vectors.push(...(await embedMiniLM(batch)));
      if ((start + batch.length) % batchLogEvery < batchSize || start + batch.length === texts.length) {
        const done = start + batch.length;
        const elapsed = ((Date.now() - started) / 1000).toFixed(0);
        console.log(`  encoded ${done}/${texts.length} (${elapsed}s)`);
      }
    }
  }

  return prepared.map((item, index) => [
    item.youtubeId,
    item.startMs,
    item.endMs,
    int8ToBase64(quantizeInt8(vectors[index])),
  ]);
}

export async function embedBrainCatalog(options: {
  videosPath?: string;
  chunksPath?: string;
  outPath?: string;
  provider?: string;
} = {}) {
  const outPath = path.resolve(options.outPath ?? DEFAULT_EMBEDDINGS_PATH);
  const catalog = await loadPreparedWindows(options);
  let provider = resolveEmbedProvider(options.provider);

  console.log(
    `Embedding ${catalog.prepared.length} windows from ${catalog.sourceChunkCount} ASR chunks ` +
      `(${catalog.videoCount} videos; skipped ${catalog.skippedUnknown} unknown, ${catalog.skippedEmpty} empty).`,
  );

  let chunks: Array<[string, number, number, string]>;
  let idfPairs: Array<[string, number]> = [];
  let dim = providerDim(provider);

  try {
    if (provider === TFIDF_PROVIDER) {
      const index = buildTfidfIndex(catalog.prepared);
      chunks = index.chunks.map((item) => [
        item.youtubeId,
        item.startMs,
        item.endMs,
        int8ToBase64(item.vector),
      ]);
      idfPairs = idfToPairs(index.idf);
      dim = EMBED_DIM;
    } else {
      chunks = await embedNeuralWindows(provider, catalog.prepared);
      dim = provider === MINILM_PROVIDER ? MINILM_DIM : providerDim(provider);
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    if (provider === TFIDF_PROVIDER) throw error;
    console.warn(`${provider} embed failed (${reason}). Falling back to ${TFIDF_PROVIDER} so prod never breaks.`);
    provider = TFIDF_PROVIDER;
    const index = buildTfidfIndex(catalog.prepared);
    chunks = index.chunks.map((item) => [
      item.youtubeId,
      item.startMs,
      item.endMs,
      int8ToBase64(item.vector),
    ]);
    idfPairs = idfToPairs(index.idf);
    dim = EMBED_DIM;
  }

  writeVectorIndexFile(outPath, {
    version: EMBED_VERSION,
    provider,
    dim,
    builtAt: new Date().toISOString(),
    chunkCount: chunks.length,
    sourceChunkCount: catalog.sourceChunkCount,
    idf: idfPairs,
    chunks,
  });

  const costNote =
    provider === OPENAI_PROVIDER
      ? "API used at seed time only; bake the file and keep OPENAI_API_KEY on Netlify for query embed"
      : "$0 API cost";
  console.log(
    `Wrote ${path.relative(process.cwd(), outPath)} · provider=${provider} · dim=${dim} · ${costNote}`,
  );
  return {
    chunkCount: chunks.length,
    sourceChunkCount: catalog.sourceChunkCount,
    outPath,
    provider,
    dim,
  };
}

async function main() {
  await embedBrainCatalog({
    videosPath: argValue("--videos"),
    chunksPath: argValue("--chunks"),
    outPath: argValue("--out"),
    provider: argValue("--provider"),
  });
}

const invokedDirectly = process.argv[1]?.includes("embed-brain-catalog");
if (invokedDirectly) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
