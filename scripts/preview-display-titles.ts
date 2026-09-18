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
