import { l2Normalize, OPENAI_DEFAULT_DIM, OPENAI_DEFAULT_MODEL } from "./embed";

export type OpenAIEmbedOptions = {
  apiKey?: string;
  model?: string;
  dimensions?: number;
};

const BATCH_SIZE = 128;

function openaiErrorMessage(status: number, body: string): string {
  const trimmed = body.replace(/\s+/g, " ").slice(0, 280);
  return `OpenAI embeddings HTTP ${status}: ${trimmed || "no body"}`;
}

async function embedBatch(texts: string[], options: Required<OpenAIEmbedOptions>): Promise<Float32Array[]> {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: options.model,
      input: texts,
      dimensions: options.dimensions,
    }),
  });
  const raw = await response.text();
  if (!response.ok) {
    throw new Error(openaiErrorMessage(response.status, raw));
  }
  const parsed = JSON.parse(raw) as {
    data?: Array<{ index: number; embedding: number[] }>;
  };
  const rows = [...(parsed.data ?? [])].sort((left, right) => left.index - right.index);
  if (rows.length !== texts.length) {
    throw new Error(`OpenAI embeddings returned ${rows.length} vectors for ${texts.length} inputs.`);
  }
  return rows.map((row) => l2Normalize(Float32Array.from(row.embedding)));
}

export async function embedOpenAI(texts: string[], options: OpenAIEmbedOptions = {}): Promise<Float32Array[]> {
  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY?.trim() ?? "";
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set.");
  }
  const model = options.model ?? process.env.OPENAI_EMBEDDING_MODEL ?? OPENAI_DEFAULT_MODEL;
  const dimensions = options.dimensions ?? OPENAI_DEFAULT_DIM;
  const out: Float32Array[] = [];
  for (let start = 0; start < texts.length; start += BATCH_SIZE) {
    const batch = texts.slice(start, start + BATCH_SIZE);
    out.push(...(await embedBatch(batch, { apiKey, model, dimensions })));
  }
  return out;
}

export function estimateOpenAIEmbedCostUsd(charCount: number): number {
  const tokens = Math.max(1, Math.ceil(charCount / 4));
  return (tokens / 1_000_000) * 0.02;
}
