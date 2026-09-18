import { mkdirSync, writeFileSync } from "node:fs";
import { access } from "node:fs/promises";
import path from "node:path";
import { MINILM_DIM, l2Normalize } from "./embed";

export const MINILM_MODEL_ID = "Xenova/all-MiniLM-L6-v2";

/**
 * Every model path is a static `path.join(process.cwd(), "data", "brain", …)`
 * literal so Next/Netlify file tracing stays inside `data/brain/models`.
 * Do not `path.join` a variable directory here — that previously traced the
 * whole repo (Sharp/libvips) into the library function (~270MB).
 */
export const DEFAULT_MINILM_CACHE_DIR = path.join(process.cwd(), "data", "brain", "models");
export const MINILM_MODEL_DIR = path.join(
  process.cwd(),
  "data",
  "brain",
  "models",
  "Xenova",
  "all-MiniLM-L6-v2",
);

const HF_BASE = "https://huggingface.co/Xenova/all-MiniLM-L6-v2/resolve/main";

const MODEL_FILES = [
  {
    url: `${HF_BASE}/config.json`,
    dest: path.join(process.cwd(), "data", "brain", "models", "Xenova", "all-MiniLM-L6-v2", "config.json"),
  },
  {
    url: `${HF_BASE}/tokenizer.json`,
    dest: path.join(process.cwd(), "data", "brain", "models", "Xenova", "all-MiniLM-L6-v2", "tokenizer.json"),
  },
  {
    url: `${HF_BASE}/tokenizer_config.json`,
    dest: path.join(
      process.cwd(),
      "data",
      "brain",
      "models",
      "Xenova",
      "all-MiniLM-L6-v2",
      "tokenizer_config.json",
    ),
  },
  {
    url: `${HF_BASE}/special_tokens_map.json`,
    dest: path.join(
      process.cwd(),
      "data",
      "brain",
      "models",
      "Xenova",
      "all-MiniLM-L6-v2",
      "special_tokens_map.json",
    ),
  },
  {
    url: `${HF_BASE}/onnx/model_quantized.onnx`,
    dest: path.join(
      process.cwd(),
      "data",
      "brain",
      "models",
      "Xenova",
      "all-MiniLM-L6-v2",
      "onnx",
      "model_quantized.onnx",
    ),
  },
] as const;

type FeatureExtractor = (
  texts: string | string[],
  options: { pooling: "mean"; normalize: boolean },
) => Promise<{ tolist: () => number[] | number[][] }>;

let extractorPromise: Promise<FeatureExtractor> | null = null;

export function minilmModelDir(): string {
  return MINILM_MODEL_DIR;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function downloadFile(url: string, dest: string): Promise<void> {
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) {
    throw new Error(`Failed to download ${url} (${response.status})`);
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  mkdirSync(path.dirname(dest), { recursive: true });
  writeFileSync(dest, bytes);
}

/** Download the quantized MiniLM files if missing. Used by embed + Netlify build. */
export async function ensureMiniLMModel(): Promise<string> {
  for (const file of MODEL_FILES) {
    if (await fileExists(file.dest)) continue;
    console.log(`Downloading ${file.dest} …`);
    await downloadFile(file.url, file.dest);
  }
  return MINILM_MODEL_DIR;
}

async function getExtractor(): Promise<FeatureExtractor> {
  if (!extractorPromise) {
    extractorPromise = (async () => {
      await ensureMiniLMModel();
      const transformers = await import("@huggingface/transformers");
      const { env, pipeline } = transformers;
      env.allowLocalModels = true;
      env.allowRemoteModels = false;
      env.localModelPath = DEFAULT_MINILM_CACHE_DIR;
      env.cacheDir = DEFAULT_MINILM_CACHE_DIR;
      // Feature-extraction only — do not initialize Sharp / image backends.
      if (env.backends.onnx.wasm) {
        env.backends.onnx.wasm.numThreads = 1;
      }
      const extractor = await pipeline("feature-extraction", MINILM_MODEL_ID, {
        dtype: "q8",
        local_files_only: true,
      });
      return extractor as unknown as FeatureExtractor;
    })().catch((error) => {
      extractorPromise = null;
      throw error;
    });
  }
  return extractorPromise;
}

function asVectors(output: number[] | number[][], expected: number): Float32Array[] {
  const rows = Array.isArray(output[0]) ? (output as number[][]) : [output as number[]];
  if (rows.length !== expected) {
    throw new Error(`MiniLM returned ${rows.length} vectors for ${expected} inputs.`);
  }
  return rows.map((row) => l2Normalize(Float32Array.from(row.slice(0, MINILM_DIM))));
}

export async function embedMiniLM(texts: string[]): Promise<Float32Array[]> {
  if (texts.length === 0) return [];
  const extractor = await getExtractor();
  const out: Float32Array[] = [];
  const batchSize = 24;
  for (let start = 0; start < texts.length; start += batchSize) {
    const batch = texts.slice(start, start + batchSize);
    const result = await extractor(batch, { pooling: "mean", normalize: true });
    out.push(...asVectors(result.tolist(), batch.length));
  }
  return out;
}

export function resetMiniLMCache(): void {
  extractorPromise = null;
}
