import { readFile } from "node:fs/promises";
import { BROWSE_SHELVES, videoMatchesBrowse } from "../src/lib/browse";
import { metadataForBrainVideo, type BrainVideo } from "../src/lib/brain-catalog";
import { loadDisplayTitleOverrides, resolveDisplayTitle } from "../src/lib/display-title";

const videosPath = new URL("../data/brain/videos.json", import.meta.url);

async function main() {
  const videos = JSON.parse(await readFile(videosPath, "utf8")) as BrainVideo[];
  const overrides = loadDisplayTitleOverrides();
  const rows = videos.filter((video) => video?.video_id).map((video) => {
    const meta = metadataForBrainVideo(video);
    const displayTitle = resolveDisplayTitle(
      meta.youtubeId,
      meta.title,
      meta.publishedAt,
      overrides,
    );
    return { ...meta, displayTitle };
  });

  console.log(`Catalog: ${rows.length} videos`);
  console.log(`Curated overrides: ${Object.keys(overrides).length}`);
  console.log(`Resolved display titles: ${rows.filter((row) => row.displayTitle).length}`);

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

  const samples = rows.filter((row) => row.displayTitle).slice(0, 12);
  console.log("\nSample display titles:");
  for (const row of samples) {
    console.log(`  ${row.youtubeId}`);
    console.log(`    raw: ${row.title}`);
    console.log(`    ui:  ${row.displayTitle}`);
  }

  if (empty.length) {
    throw new Error(`Empty browse shelves: ${empty.join(", ")}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
