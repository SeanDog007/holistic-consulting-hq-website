import { PrismaClient } from "@prisma/client";
import { DEMO_VIDEOS } from "../src/lib/demo-catalog";
import { youtubeThumbnail } from "../src/lib/format";
import { toJsonArray } from "../src/lib/json";

const prisma = new PrismaClient();

async function main() {
  for (const video of DEMO_VIDEOS) {
    const record = await prisma.video.upsert({
      where: { youtubeId: video.youtubeId },
      create: {
        youtubeId: video.youtubeId,
        title: video.title,
        description: video.description,
        publishedAt: new Date(video.publishedAt),
        durationSec: video.durationSec,
        thumbnailUrl: youtubeThumbnail(video.youtubeId),
        speakers: toJsonArray(video.speakers),
        programs: toJsonArray(video.programs),
        topics: toJsonArray(video.topics),
        source: "youtube",
      },
      update: {
        title: video.title,
        description: video.description,
        publishedAt: new Date(video.publishedAt),
        durationSec: video.durationSec,
        thumbnailUrl: youtubeThumbnail(video.youtubeId),
        speakers: toJsonArray(video.speakers),
        programs: toJsonArray(video.programs),
        topics: toJsonArray(video.topics),
      },
    });

    await prisma.transcriptSegment.deleteMany({ where: { videoId: record.id } });
    if (video.cues.length) {
      await prisma.transcriptSegment.createMany({
        data: video.cues.map((cue) => ({
          videoId: record.id,
          startMs: cue.startMs,
          endMs: cue.endMs ?? null,
          text: cue.text,
        })),
      });
    }
  }

  const videos = await prisma.video.count();
  const segments = await prisma.transcriptSegment.count();
  console.log(`Seeded ${videos} videos and ${segments} transcript segments.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
