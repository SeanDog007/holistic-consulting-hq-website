/**
 * Local Brain embeddings: hashed TF-IDF vectors + query expansion.
 *
 * Provider: `local-hash-tfidf-v1` (no paid API). Same encoder builds the
 * committed index and embeds queries at request time so Netlify does not
 * need OpenAI/pgvector. Cost is $0.
 */

export const EMBED_PROVIDER = "local-hash-tfidf-v1";
export const EMBED_VERSION = 1;
export const EMBED_DIM = 256;

const STOP = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "been",
  "but",
  "by",
  "can",
  "do",
  "for",
  "from",
  "had",
  "has",
  "have",
  "how",
  "i",
  "if",
  "in",
  "into",
  "is",
  "it",
  "its",
  "just",
  "me",
  "my",
  "not",
  "of",
  "on",
  "or",
  "our",
  "so",
  "than",
  "that",
  "the",
  "their",
  "them",
  "then",
  "there",
  "these",
  "they",
  "this",
  "to",
  "too",
  "up",
  "was",
  "we",
  "were",
  "what",
  "when",
  "which",
  "who",
  "will",
  "with",
  "would",
  "you",
  "your",
  "about",
  "said",
  "also",
  "very",
  "really",
  "going",
  "gonna",
  "yeah",
  "okay",
  "ok",
  "um",
  "uh",
]);

/**
 * Bidirectional paraphrase groups. If any phrase appears, the rest are
 * added before tokenize so “small bowel overgrowth” can retrieve SIBO.
 * Retrieval/citations only — do not treat these as clinical advice.
 */
export const SYNONYM_GROUPS: string[][] = [
  [
    "sibo",
    "small intestinal bacterial overgrowth",
    "small intestine bacterial overgrowth",
    "bacterial overgrowth",
    "small bowel overgrowth",
    "small bowel bacterial overgrowth",
    "hydrogen breath",
    "imo",
    "intestinal methanogen",
  ],
  [
    "herbal safety",
    "herb safety",
    "plant safety",
    "safe herb",
    "safe herbs",
    "herb drug",
    "herb-drug",
    "contraindication",
    "contraindications",
    "contraindicated",
    "contraindicat",
  ],
  ["licorice", "glycyrrhiza", "dgl", "deglycyrrhizinated"],
  ["leaky gut", "intestinal permeability", "tight junction"],
  ["candida", "yeast overgrowth", "candidiasis"],
  ["gerd", "acid reflux", "heartburn", "reflux"],
  ["ibs", "irritable bowel"],
  ["pcos", "polycystic ovary", "polycystic ovarian"],
  ["bchn", "board certified holist", "nanp", "board exam"],
  ["betsy", "betsy miller"],
  ["pregnancy", "pregnant", "prenatal", "gestation"],
  ["microbiome", "gut flora", "gut bacteria", "dysbiosis"],
  ["motility", "migrating motor complex", "mmc"],
  ["bitters", "digestive bitter"],
  ["histamine", "dao", "mast cell"],
];

export function expandForEmbed(text: string): string {
  const lower = ` ${text.toLowerCase()} `;
  const extra: string[] = [];
  for (const group of SYNONYM_GROUPS) {
    if (group.some((phrase) => lower.includes(phrase))) {
      extra.push(...group);
    }
  }
  return extra.length ? `${text} ${extra.join(" ")}` : text;
}

function lightStem(word: string): string {
  if (word.length <= 4) return word;
  if (word.endsWith("ational") && word.length > 9) return `${word.slice(0, -7)}e`;
  if (word.endsWith("tion") && word.length > 6) return word.slice(0, -3);
  if (word.endsWith("ness") && word.length > 6) return word.slice(0, -4);
  if (word.endsWith("ing") && word.length > 6) return word.slice(0, -3);
  if (word.endsWith("ed") && word.length > 5) return word.slice(0, -2);
  if (word.endsWith("ies") && word.length > 5) return `${word.slice(0, -3)}y`;
  if (word.endsWith("es") && word.length > 5) return word.slice(0, -2);
  if (word.endsWith("s") && !word.endsWith("ss") && word.length > 4) return word.slice(0, -1);
  return word;
}

export function tokenize(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9+]+/g, " ")
    .split(/\s+/)
    .map(lightStem)
    .filter((word) => word.length > 1 && !STOP.has(word));

  const tokens = [...words];
  for (let index = 0; index < words.length - 1; index += 1) {
    tokens.push(`${words[index]}_${words[index + 1]}`);
  }
  return tokens;
}

export function tokenFrequencies(tokens: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const token of tokens) {
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }
  return counts;
}

/** Stable FNV-1a 32-bit. */
export function fnv1a(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function l2Normalize(values: Float32Array): Float32Array {
  let sum = 0;
  for (const value of values) sum += value * value;
  const norm = Math.sqrt(sum);
  if (norm === 0) return values;
  for (let index = 0; index < values.length; index += 1) {
    values[index] /= norm;
  }
  return values;
}

export function embedTokens(
  tokens: string[],
  idf: Map<string, number>,
  dim = EMBED_DIM,
): Float32Array {
  const vector = new Float32Array(dim);
  const freqs = tokenFrequencies(tokens);
  if (freqs.size === 0) return vector;

  const fallbackIdf = 1;
  for (const [token, tf] of freqs) {
    const weight = (1 + Math.log(tf)) * (idf.get(token) ?? fallbackIdf);
    const hash = fnv1a(token);
    const slot = hash % dim;
    const sign = hash & 1 ? 1 : -1;
    vector[slot] += sign * weight;
  }
  return l2Normalize(vector);
}

export function embedText(text: string, idf: Map<string, number>, dim = EMBED_DIM): Float32Array {
  return embedTokens(tokenize(expandForEmbed(text)), idf, dim);
}

/** Mix two unit vectors. Title context stays light so the spoken window wins the timestamp. */
export function mixVectors(primary: Float32Array, secondary: Float32Array, primaryWeight = 0.82): Float32Array {
  const out = new Float32Array(primary.length);
  const secondaryWeight = 1 - primaryWeight;
  for (let index = 0; index < primary.length; index += 1) {
    out[index] = primary[index] * primaryWeight + (secondary[index] ?? 0) * secondaryWeight;
  }
  return l2Normalize(out);
}

export function cosine(a: ArrayLike<number>, b: ArrayLike<number>): number {
  const len = Math.min(a.length, b.length);
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let index = 0; index < len; index += 1) {
    const left = a[index];
    const right = b[index];
    dot += left * right;
    normA += left * left;
    normB += right * right;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / Math.sqrt(normA * normB);
}

export function quantizeInt8(vector: Float32Array): Int8Array {
  let max = 0;
  for (const value of vector) max = Math.max(max, Math.abs(value));
  const scale = max > 0 ? 127 / max : 1;
  const out = new Int8Array(vector.length);
  for (let index = 0; index < vector.length; index += 1) {
    out[index] = Math.max(-127, Math.min(127, Math.round(vector[index] * scale)));
  }
  return out;
}

export function int8FromBase64(value: string): Int8Array {
  return new Int8Array(Buffer.from(value, "base64"));
}

export function int8ToBase64(values: Int8Array): string {
  return Buffer.from(values.buffer, values.byteOffset, values.byteLength).toString("base64");
}

export function computeIdf(documentTokens: string[][]): Map<string, number> {
  const df = new Map<string, number>();
  const n = documentTokens.length;
  for (const tokens of documentTokens) {
    const seen = new Set(tokens);
    for (const token of seen) {
      df.set(token, (df.get(token) ?? 0) + 1);
    }
  }
  const idf = new Map<string, number>();
  for (const [token, count] of df) {
    idf.set(token, Math.log((n + 1) / (count + 1)) + 1);
  }
  return idf;
}

export function idfToPairs(idf: Map<string, number>): Array<[string, number]> {
  return [...idf.entries()].map(([token, value]) => [token, Number(value.toFixed(4))]);
}

export function idfFromPairs(pairs: Array<[string, number]>): Map<string, number> {
  return new Map(pairs);
}
