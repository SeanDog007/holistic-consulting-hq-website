import { readFile } from "node:fs/promises";
import { BROWSE_SHELVES, videoMatchesBrowse } from "../src/lib/browse";
import { metadataForBrainVideo, type BrainVideo } from "../src/lib/brain-catalog";
import { extractSpeakers, mergeSpeakers } from "../src/lib/classify";
import {
  listDisplayTitleBatchFiles,
  loadDisplayTitleOverrides,
  loadSpeakerOverrides,
  resolveDisplayTitle,
} from "../src/lib/display-title";

const videosPath = new URL("../data/brain/videos.json", import.meta.url);

async function main() {
  const videos = JSON.parse(await readFile(videosPath, "utf8")) as BrainVideo[];
  const catalogIds = new Set(videos.filter((video) => video?.video_id).map((video) => video.video_id));
  const overrides = loadDisplayTitleOverrides();
  const speakerOverrides = loadSpeakerOverrides();
  const batches = listDisplayTitleBatchFiles();
  const rows = videos.filter((video) => video?.video_id).map((video) => {
    const meta = metadataForBrainVideo(video);
    const displayTitle = resolveDisplayTitle(
      meta.youtubeId,
      meta.title,
      meta.publishedAt,
      overrides,
    );
    const speakers = mergeSpeakers(
      meta.speakers,
      displayTitle ? extractSpeakers(displayTitle) : [],
      speakerOverrides[meta.youtubeId],
    );
    return { ...meta, displayTitle, speakers };
  });

  const batchIds = new Set(
    rows.filter((row) => overrides[row.youtubeId]).map((row) => row.youtubeId),
  );
  console.log(`Catalog: ${rows.length} videos`);
  console.log(`Batch files: ${batches.map((batch) => `batch-${batch.batch}`).join(", ") || "(none)"}`);
  console.log(`Overrides loaded: ${Object.keys(overrides).length} (YouTube video_id keys)`);
  console.log(`Catalog rows with an override: ${batchIds.size}`);
  console.log(`Resolved display titles: ${rows.filter((row) => row.displayTitle).length}`);
  console.log(`Speaker overrides: ${Object.keys(speakerOverrides).length}`);

  let totalMisses = 0;
  for (const batch of batches) {
    const ids = Object.keys(batch.titles);
    const misses = ids.filter((id) => !catalogIds.has(id));
    totalMisses += misses.length;
    console.log(
      `  batch-${batch.batch}: ${ids.length} titles, ${ids.length - misses.length} matched, ${misses.length} missing`,
    );
    for (const id of misses) {
      console.log(`    miss: ${id} → ${batch.titles[id]}`);
    }
  }
  console.log(`Batch miss count: ${totalMisses}`);

  const empty: string[] = [];
  for (const shelf of BROWSE_SHELVES) {
    const count = rows.filter((row) =>
      videoMatchesBrowse(shelf.id, {
        title: row.title,
        displayTitle: row.displayTitle,
        programs: row.programs,
        topics: row.topics,
      }),
    ).length;
    console.log(`  ${shelf.label}: ${count}`);
    if (count === 0) empty.push(shelf.label);
  }

  const guestSamples = rows.filter((row) =>
    ["1dbKV5Lymk8", "JU8zEO73Lus", "PUftt5qImWE", "iF5Wuuev8QU", "fBDUxQs8624"].includes(
      row.youtubeId,
    ),
  );
  console.log("\nBatch-2 guest samples:");
  for (const row of guestSamples) {
    console.log(`  ${row.youtubeId}`);
    console.log(`    raw: ${row.title}`);
    console.log(`    ui:  ${row.displayTitle}`);
    console.log(`    speakers: ${row.speakers.join(" · ") || "(none)"}`);
  }

  const polishSamples = rows.filter((row) =>
    ["fTFtNY7Up8E", "VXwxBl1Ckq0", "64Y9L1_fNtc"].includes(row.youtubeId),
  );
  console.log("\nBatch-3 topic-polish samples:");
  for (const row of polishSamples) {
    console.log(`  ${row.youtubeId}`);
    console.log(`    raw: ${row.title}`);
    console.log(`    ui:  ${row.displayTitle}`);
    console.log(`    speakers: ${row.speakers.join(" · ") || "(none)"}`);
  }

  const rosterSamples = rows.filter((row) =>
    ["1fvdwb-H3oc", "3tNlPl4x7VY", "KDQ9goYpzc0", "Nqjsrukws2g", "YtzYbcU0IRA", "cj3TRKZaplY"].includes(
      row.youtubeId,
    ),
  );
  console.log("\nBatch-4 roster samples:");
  for (const row of rosterSamples) {
    console.log(`  ${row.youtubeId}`);
    console.log(`    raw: ${row.title}`);
    console.log(`    ui:  ${row.displayTitle}`);
    console.log(`    speakers: ${row.speakers.join(" · ") || "(none)"}`);
  }

  const finishSamples = [
    "WmxHXioxJsI",
    "HkOlHqzTS_4",
    "VLjxq5FpnAc",
    "SeQQkvqS1q8",
    "kkJU32Aens0",
    "4evhQ9yps-A",
    "JS3s2u1kMxM",
    "3xrdFKJve78",
    "fwZz9ZHX-Dk",
    "Bzy8G9BAqpg",
  ];
  const expectedFinish: Record<string, { raw: string; ui: string }> = {
    WmxHXioxJsI: {
      raw: "Community Live 09152026",
      ui: "Community Live — Sep 15, 2026",
    },
    HkOlHqzTS_4: {
      raw: "GMT20260429 233158 Recording 1920x1080",
      ui: "Recording — Apr 29, 2026",
    },
    VLjxq5FpnAc: { raw: "Redfining IBS", ui: "Redefining IBS" },
    SeQQkvqS1q8: {
      raw: "7_1_}2026 NGR_MidYear Goals",
      ui: "New Graduate Roundtable: Mid-Year Goals — Jul 1, 2026",
    },
    kkJU32Aens0: {
      raw: "Masering Immune Balance Part 1",
      ui: "Mastering Immune Balance Part 1",
    },
    "4evhQ9yps-A": {
      raw: "Intro to Herbalism - Digestion",
      ui: "Intro to Herbalism: Digestion",
    },
    JS3s2u1kMxM: {
      raw: "10 29 2025 Member Roundtable",
      ui: "Member Roundtable — Oct 29, 2025",
    },
    "3xrdFKJve78": {
      raw: "AI in Nutrition NGR 5 13 26",
      ui: "New Graduate Roundtable: AI in Nutrition — May 13, 2026",
    },
    "fwZz9ZHX-Dk": {
      raw: "Journal Roundtable 8 20 2025",
      ui: "Journal Roundtable — Aug 20, 2025",
    },
    Bzy8G9BAqpg: {
      raw: "GI Digestive Health Pt 1a",
      ui: "GI Digestive Health, Part 1a",
    },
  };
  console.log("\nBatches 5–8 finish samples:");
  const byId = new Map(rows.map((row) => [row.youtubeId, row]));
  for (const id of finishSamples) {
    const row = byId.get(id);
    const expected = expectedFinish[id];
    console.log(`  ${id}`);
    console.log(`    raw: ${row?.title ?? "(missing)"}`);
    console.log(`    ui:  ${row?.displayTitle ?? "(none)"}`);
    if (!row || row.title !== expected.raw || row.displayTitle !== expected.ui) {
      throw new Error(
        `Finish sample mismatch for ${id}: raw=${row?.title} ui=${row?.displayTitle}`,
      );
    }
  }

  const uncovered = rows.filter((row) => !overrides[row.youtubeId]);
  console.log(`Catalog coverage: ${rows.length - uncovered.length}/${rows.length}`);
  if (uncovered.length) {
    throw new Error(
      `Videos without a display-title override: ${uncovered.map((row) => row.youtubeId).join(", ")}`,
    );
  }

  if (empty.length) {
    throw new Error(`Empty browse shelves: ${empty.join(", ")}`);
  }
  if (totalMisses) {
    throw new Error(`Display-title batch misses: ${totalMisses}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
