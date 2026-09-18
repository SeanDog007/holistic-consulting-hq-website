import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { MINILM_DIM, l2Normalize } from "./embed";

export const MINILM_MODEL_ID = "Xenova/all-MiniLM-L6-v2";
export const DEFAULT_MINILM_CACHE_DIR = path.join(process.cwd(), "data/brain/models");

const MODEL_FILES = [
  "config.json",
  "tokenizer.json",
  "tokenizer_config.json",
  "special_tokens_map.json",
  "onnx/model_quantized.onnx",
] as const;

const HF_BASE = `https://huggingface.co/${MINILM_MODEL_ID}/resolve/main`;

type FeatureExtractor = (
  texts: string | string[],
  options: { pooling: "mean"; normalize: boolean },
) => Promise<{ tolist: () => number[] | number[][] }>;

let extractorPromise: Promise<FeatureExtractor> | null = null;

export function minilmModelDir(cacheDir = DEFAULT_MINILM_CACHE_DIR): string {
  return path.join(cacheDir, ...MINILM_MODEL_ID.split("/"));
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    const { access } = await import("node:fs/promises");
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
export async function ensureMiniLMModel(cacheDir = DEFAULT_MINILM_CACHE_DIR): Promise<string> {
  const root = minilmModelDir(cacheDir);
  for (const relative of MODEL_FILES) {
    const dest = path.join(root, relative);
    if (await fileExists(dest)) continue;
    console.log(`Downloading ${MINILM_MODEL_ID}/${relative} …`);
    await downloadFile(`${HF_BASE}/${relative}`, dest);
  }
  return root;
}

async function getExtractor(): Promise<FeatureExtractor> {
  if (!extractorPromise) {
    extractorPromise = (async () => {
      const cacheDir = process.env.BRAIN_MINILM_CACHE ?? DEFAULT_MINILM_CACHE_DIR;
      await ensureMiniLMModel(cacheDir);
      const transformers = await import("@huggingface/transformers");
      const { env, pipeline } = transformers;
      env.allowLocalModels = true;
      env.allowRemoteModels = true;
      env.localModelPath = cacheDir;
      env.cacheDir = cacheDir;
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
  return rows.map((row) => {
    const vector = Float32Array.from(row.slice(0, MINILM_DIM));
    return l2Normalize(vector);
  });
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
