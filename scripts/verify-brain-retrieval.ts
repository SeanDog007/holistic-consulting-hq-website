import { buildTfidfIndex, loadPreparedWindows } from "./embed-brain-catalog";
import { TFIDF_PROVIDER } from "../src/lib/embed";
import { readVectorIndexFile, searchVectorIndex, type SemanticHit, type VectorIndex } from "../src/lib/vector-index";

type Case = {
  query: string;
  expectYoutubeId: string | string[];
  label: string;
  startSecMin?: number;
  startSecMax?: number;
  /** When true, TF-IDF is expected to miss or rank the target poorly. */
  paraphraseGap?: boolean;
};

const CASES: Case[] = [
  {
    query: "gut bacteria overgrowth in the small bowel",
    expectYoutubeId: ["9n9oLpV3uag", "tkINS6S4FDs"],
    label: "SIBO synonym → SIBO teaching talks",
  },
  {
    query: "What has Betsy said about herbal safety?",
    expectYoutubeId: "mowBWYHvJwg",
    label: "Betsy herbal safety question → Betsy botanical-safety clip",
  },
  {
    query: "principles of plant safety",
    expectYoutubeId: "fgBuBZdnVvw",
    label: "plant safety paraphrase → Principles of Herbal Safety",
  },
  {
    query: "a fungal overgrowth in the gut that thrives when bacteria are wiped out",
    expectYoutubeId: "GS5ocaPI2pA",
    label: "candida paraphrase (no candida/yeast) → Candida Overgrowth",
    paraphraseGap: true,
  },
  {
    query: "aged cheese wine and leftovers triggering itching and flushing",
    expectYoutubeId: ["xIbvG2brGXA", "faq8U0Rt6fw"],
    label: "histamine leftovers paraphrase (no histamine word) → Histamine talks",
    paraphraseGap: true,
  },
];

function expectedIds(test: Case): string[] {
  return Array.isArray(test.expectYoutubeId) ? test.expectYoutubeId : [test.expectYoutubeId];
}

function findMatch(hits: SemanticHit[], test: Case): SemanticHit | undefined {
  const allowed = new Set(expectedIds(test));
  return hits.find((hit) => {
    if (!allowed.has(hit.youtubeId)) return false;
    const startSec = Math.floor(hit.startMs / 1000);
    if (test.startSecMin != null && startSec < test.startSecMin) return false;
    if (test.startSecMax != null && startSec > test.startSecMax) return false;
    return true;
  });
}

function diversityOk(hits: SemanticHit[]): boolean {
  const perVideo = new Map<string, number>();
  for (const hit of hits) {
    const used = (perVideo.get(hit.youtubeId) ?? 0) + 1;
    perVideo.set(hit.youtubeId, used);
    if (used > 2) return false;
  }
  return true;
}

function rankOf(hits: SemanticHit[], youtubeIds: string | string[]): number {
  const allowed = new Set(Array.isArray(youtubeIds) ? youtubeIds : [youtubeIds]);
  return hits.findIndex((hit) => allowed.has(hit.youtubeId));
}

function fmtHit(hit: SemanticHit | undefined): string {
  if (!hit) return "miss";
  return `${hit.youtubeId} t=${Math.floor(hit.startMs / 1000)}s score=${hit.score.toFixed(3)}`;
}

async function searchProvider(query: string, index: VectorIndex): Promise<SemanticHit[]> {
  return searchVectorIndex(query, { index, topK: 24, maxPerVideo: 2 });
}

async function main() {
  const index = readVectorIndexFile();
  const compareTfidf = process.argv.includes("--compare-tfidf") || index.provider !== TFIDF_PROVIDER;
  let tfidfIndex: VectorIndex | null = null;
  if (compareTfidf) {
    console.log("Building in-memory TF-IDF index for before/after compare…");
    const catalog = await loadPreparedWindows();
    tfidfIndex = buildTfidfIndex(catalog.prepared);
  }

  let failed = 0;
  const gapRows: string[] = [];

  for (const test of CASES) {
    const hits = await searchProvider(test.query, index);
    const match = findMatch(hits, test);
    const ok = Boolean(match) && diversityOk(hits);
    if (!ok) failed += 1;

    let tfidfNote = "";
    if (tfidfIndex) {
      const tfidfHits = await searchProvider(test.query, { ...tfidfIndex, provider: TFIDF_PROVIDER });
      const tfidfMatch = findMatch(tfidfHits, test);
      const tfidfRank = rankOf(tfidfHits, test.expectYoutubeId);
      const neuralRank = rankOf(hits, test.expectYoutubeId);
      tfidfNote =
        `\n       tfidf  ${fmtHit(tfidfHits[0])} expectedRank=${tfidfRank < 0 ? "miss" : tfidfRank + 1}` +
        `\n       neural ${fmtHit(hits[0])} expectedRank=${neuralRank < 0 ? "miss" : neuralRank + 1}`;
      if (test.paraphraseGap) {
        const tfidfFailed = !tfidfMatch || tfidfRank > 4;
        gapRows.push(
          `${tfidfFailed ? "GAP" : "both"}  ${test.label}\n` +
            `       q=${JSON.stringify(test.query)}\n` +
            `       TF-IDF: ${tfidfMatch ? `rank ${tfidfRank + 1} ${fmtHit(tfidfMatch)}` : `miss · top ${fmtHit(tfidfHits[0])}`}\n` +
            `       ${index.provider}: ${match ? `rank ${neuralRank + 1} ${fmtHit(match)}` : `miss · top ${fmtHit(hits[0])}`}`,
        );
        if (!tfidfFailed) {
          console.warn(`WARN  paraphrase gap case still ranks on TF-IDF: ${test.label}`);
        }
      }
    }

    console.log(
      `${ok ? "PASS" : "FAIL"}  ${test.label}\n` +
        `       q=${JSON.stringify(test.query)}\n` +
        `       expected=${expectedIds(test).join("|")} ${fmtHit(match)}\n` +
        `       top=${fmtHit(hits[0])}` +
        `${diversityOk(hits) ? "" : "\n       diversity: more than 2 hits/video"}` +
        tfidfNote,
    );
  }

  if (gapRows.length) {
    console.log("\n--- Paraphrase gaps (TF-IDF weak, neural should recover) ---");
    for (const row of gapRows) console.log(row);
  }

  console.log(
    `\nIndex: provider=${index.provider} dim=${index.dim} windows=${index.chunkCount} sourceChunks=${index.sourceChunkCount}`,
  );
  if (failed) {
    console.error(`\n${failed} retrieval check(s) failed.`);
    process.exit(1);
  }
  console.log("\nAll retrieval checks passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
