import { readVectorIndexFile, searchVectorIndex } from "../src/lib/vector-index";

type Case = {
  query: string;
  expectYoutubeId: string;
  label: string;
  startSecMin?: number;
  startSecMax?: number;
};

const CASES: Case[] = [
  {
    query: "gut bacteria overgrowth in the small bowel",
    expectYoutubeId: "9n9oLpV3uag",
    label: "SIBO paraphrase → SIBO Masterclass",
  },
  {
    query: "What has Betsy said about herbal safety?",
    expectYoutubeId: "mowBWYHvJwg",
    label: "Betsy herbal safety question → Betsy botanical-safety clip",
    startSecMin: 2280,
    startSecMax: 2600,
  },
  {
    query: "principles of plant safety",
    expectYoutubeId: "fgBuBZdnVvw",
    label: "plant safety paraphrase → Principles of Herbal Safety",
  },
];

function main() {
  const index = readVectorIndexFile();
  let failed = 0;

  for (const test of CASES) {
    const hits = searchVectorIndex(test.query, { index, topK: 24, maxPerVideo: 2 });
    const match = hits.find((hit) => {
      if (hit.youtubeId !== test.expectYoutubeId) return false;
      const startSec = Math.floor(hit.startMs / 1000);
      if (test.startSecMin != null && startSec < test.startSecMin) return false;
      if (test.startSecMax != null && startSec > test.startSecMax) return false;
      return true;
    });
    const top = hits[0];
    const ok = Boolean(match);
    const perVideo = new Map<string, number>();
    let diversityOk = true;
    for (const hit of hits) {
      const used = (perVideo.get(hit.youtubeId) ?? 0) + 1;
      perVideo.set(hit.youtubeId, used);
      if (used > 2) diversityOk = false;
    }
    if (!ok || !diversityOk) failed += 1;
    const startSec = match ? Math.floor(match.startMs / 1000) : null;
    console.log(
      `${ok && diversityOk ? "PASS" : "FAIL"}  ${test.label}\n` +
        `       q=${JSON.stringify(test.query)}\n` +
        `       expected=${test.expectYoutubeId} score=${match?.score.toFixed(3) ?? "miss"} t=${startSec ?? "—"}\n` +
        `       top=${top?.youtubeId ?? "none"} ${top ? `t=${Math.floor(top.startMs / 1000)}s score=${top.score.toFixed(3)}` : ""}` +
        `${diversityOk ? "" : "\n       diversity: more than 2 hits/video"}`,
    );
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

main();
