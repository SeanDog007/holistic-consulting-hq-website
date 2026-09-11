import { prisma } from "@/lib/db";
import { DEMO_VIDEOS } from "@/lib/demo-catalog";
import { youtubeThumbnail } from "@/lib/format";
import { toJsonArray } from "@/lib/json";

export async function seedDemoCatalog() {
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
}

export async function ensureDemoData() {
  const count = await prisma.video.count();
  if (count > 0) return;
  await seedDemoCatalog();
}
