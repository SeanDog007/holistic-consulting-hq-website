import { gunzipSync, gzipSync } from "node:zlib";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  cosine,
  embedQuery,
  EMBED_VERSION,
  idfFromPairs,
  int8FromBase64,
  isSupportedProvider,
  minSemanticScore,
} from "./embed";

export const DEFAULT_EMBEDDINGS_PATH = path.join(process.cwd(), "data", "brain", "embeddings.json.gz");

export type IndexedChunk = {
  youtubeId: string;
  startMs: number;
  endMs: number;
  vector: Int8Array;
};

export type SemanticHit = {
  youtubeId: string;
  startMs: number;
  endMs: number;
  score: number;
};

export type VectorIndexFile = {
  version: number;
  provider: string;
  dim: number;
  builtAt: string;
  chunkCount: number;
  sourceChunkCount: number;
  idf: Array<[string, number]>;
  /** [youtubeId, startMs, endMs, int8-base64] */
  chunks: Array<[string, number, number, string]>;
};

export type VectorIndex = {
  version: number;
  provider: string;
  dim: number;
  builtAt: string;
  chunkCount: number;
  sourceChunkCount: number;
  idf: Map<string, number>;
  chunks: IndexedChunk[];
};

const MAX_HITS_PER_VIDEO = 2;

let cached: VectorIndex | null | undefined;
let lastSemanticError: string | null = null;

/** Last query-embed failure (MiniLM/OpenAI). Search then continues keyword-only. */
export function lastVectorSearchError(): string | null {
  return lastSemanticError;
}

function embeddingsCandidates(): string[] {
  return [path.join(process.cwd(), "data", "brain", "embeddings.json.gz")];
}

export function readVectorIndexFile(filePath = DEFAULT_EMBEDDINGS_PATH): VectorIndex {
  const raw = readFileSync(filePath);
  const parsed = JSON.parse(gunzipSync(raw).toString("utf8")) as VectorIndexFile;
  if ((parsed.version !== EMBED_VERSION && parsed.version !== 1) || !isSupportedProvider(parsed.provider)) {
    throw new Error(
      `Unsupported embeddings file (version=${parsed.version}, provider=${parsed.provider}). Re-run npm run brain:embed.`,
    );
  }
  return {
    version: parsed.version,
    provider: parsed.provider,
    dim: parsed.dim,
    builtAt: parsed.builtAt,
    chunkCount: parsed.chunkCount,
    sourceChunkCount: parsed.sourceChunkCount,
    idf: idfFromPairs(parsed.idf ?? []),
    chunks: parsed.chunks.map(([youtubeId, startMs, endMs, encoded]) => ({
      youtubeId,
      startMs,
      endMs,
      vector: int8FromBase64(encoded),
    })),
  };
}

export function writeVectorIndexFile(filePath: string, file: VectorIndexFile): void {
  writeFileSync(filePath, gzipSync(Buffer.from(JSON.stringify(file)), { level: 9 }));
}

export function loadVectorIndex(): VectorIndex | null {
  if (cached !== undefined) return cached;
  for (const candidate of embeddingsCandidates()) {
    try {
      cached = readVectorIndexFile(candidate);
      return cached;
    } catch {
      // try next path
    }
  }
  cached = null;
  return null;
}

export function resetVectorIndexCache(): void {
  cached = undefined;
}

export async function searchVectorIndex(
  query: string,
  options: { topK?: number; maxPerVideo?: number; index?: VectorIndex | null } = {},
): Promise<SemanticHit[]> {
  lastSemanticError = null;
  const index = options.index === undefined ? loadVectorIndex() : options.index;
  if (!index || !query.trim()) return [];

  const topK = options.topK ?? 40;
  const maxPerVideo = options.maxPerVideo ?? MAX_HITS_PER_VIDEO;
  let queryVector: Float32Array;
  try {
    queryVector = await embedQuery(query, index);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    lastSemanticError = `${index.provider}: ${reason}`;
    console.warn(`Semantic embed failed (${index.provider}): ${reason}. Falling back to keyword search.`);
    return [];
  }

  const floor = minSemanticScore(index.provider);
  const scored: SemanticHit[] = [];
  for (const chunk of index.chunks) {
    const score = cosine(queryVector, chunk.vector);
    if (score <= floor) continue;
    scored.push({
      youtubeId: chunk.youtubeId,
      startMs: chunk.startMs,
      endMs: chunk.endMs,
      score,
    });
  }

  scored.sort((left, right) => right.score - left.score);

  const perVideo = new Map<string, number>();
  const diversified: SemanticHit[] = [];
  for (const hit of scored) {
    const used = perVideo.get(hit.youtubeId) ?? 0;
    if (used >= maxPerVideo) continue;
    perVideo.set(hit.youtubeId, used + 1);
    diversified.push(hit);
    if (diversified.length >= topK) break;
  }
  return diversified;
}
