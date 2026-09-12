import { PrismaClient } from "@prisma/client";
import { fetchCaptionCues, fetchChannelUploads, mapYoutubeVideo } from "../src/lib/youtube";
import { toJsonArray } from "../src/lib/json";

const prisma = new PrismaClient();

function argValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

async function main() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.error("YOUTUBE_API_KEY is not set.");
    console.error("Add it to .env, then rerun: npm run ingest");
    console.error("Without a key, use the demo catalog: npm run db:seed");
    process.exit(1);
  }

  const handle = argValue("--handle") ?? process.env.YOUTUBE_CHANNEL_HANDLE ?? "HolisticConsulting";
  const max = Number(argValue("--max") ?? "0");
  const skipCaptions = hasFlag("--skip-captions");

  console.log(`Fetching uploads for @${handle.replace(/^@/, "")}…`);
  const resources = await fetchChannelUploads(apiKey, handle);
  const selected = max > 0 ? resources.slice(0, max) : resources;
  console.log(`Found ${resources.length} videos. Ingesting ${selected.length}.`);

  let captioned = 0;
  for (const [index, resource] of selected.entries()) {
    let cues = [] as Awaited<ReturnType<typeof fetchCaptionCues>>;
    if (!skipCaptions) {
      try {
        cues = await fetchCaptionCues(resource.id);
        if (cues.length) captioned += 1;
      } catch (error) {
        console.warn(`Captions failed for ${resource.id}:`, error instanceof Error ? error.message : error);
      }
    }

    const video = mapYoutubeVideo(resource, cues);
    const record = await prisma.video.upsert({
      where: { youtubeId: video.youtubeId },
      create: {
        youtubeId: video.youtubeId,
        title: video.title,
        description: video.description,
        publishedAt: video.publishedAt,
        durationSec: video.durationSec,
        thumbnailUrl: video.thumbnailUrl,
        speakers: toJsonArray(video.speakers),
        programs: toJsonArray(video.programs),
        topics: toJsonArray(video.topics),
        source: video.source,
      },
      update: {
        title: video.title,
        description: video.description,
        publishedAt: video.publishedAt,
        durationSec: video.durationSec,
        thumbnailUrl: video.thumbnailUrl,
        speakers: toJsonArray(video.speakers),
        programs: toJsonArray(video.programs),
        topics: toJsonArray(video.topics),
        source: video.source,
      },
    });

    await prisma.transcriptSegment.deleteMany({ where: { videoId: record.id } });
    if (cues.length) {
      await prisma.transcriptSegment.createMany({
        data: cues.map((cue) => ({
          videoId: record.id,
          startMs: cue.startMs,
          endMs: cue.endMs ?? null,
          text: cue.text,
        })),
      });
    }

    console.log(
      `(${index + 1}/${selected.length}) ${video.title} — ${cues.length} caption segments`,
    );
  }

  console.log(`Done. Captions stored for ${captioned}/${selected.length} videos.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
