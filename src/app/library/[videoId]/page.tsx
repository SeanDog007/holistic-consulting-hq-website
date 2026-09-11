import Link from "next/link";
import { notFound } from "next/navigation";
import { WatchWorkspace } from "@/components/WatchWorkspace";
import { prisma } from "@/lib/db";
import { ensureDemoData } from "@/lib/ensure-data";
import { formatDuration, formatPublishedDate } from "@/lib/format";
import { parseJsonArray } from "@/lib/json";

export const dynamic = "force-dynamic";

export default async function LibraryVideoPage({
  params,
  searchParams,
}: {
  params: Promise<{ videoId: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  await ensureDemoData();
  const { videoId } = await params;
  const { t } = await searchParams;

  const video = await prisma.video.findUnique({
    where: { id: videoId },
    include: { segments: { orderBy: { startMs: "asc" } } },
  });

  if (!video) notFound();

  const speakers = parseJsonArray(video.speakers);
  const programs = parseJsonArray(video.programs);
  const topics = parseJsonArray(video.topics);
  const startSec = Number(t);
  const initialTime = Number.isFinite(startSec) && startSec > 0 ? startSec : 0;

  return (
    <section className="bg-off-white py-12">
      <div className="container-site">
        <Link
          href="/library"
          className="text-[0.75rem] font-semibold tracking-[0.12em] text-gold uppercase"
        >
          ← Back to the shelves
        </Link>
        <div className="mt-6 mb-8">
          <div className="mb-3 flex flex-wrap gap-3">
            {programs.map((program) => (
              <span
                key={program}
                className="text-[0.65rem] font-semibold tracking-[0.14em] text-gold uppercase"
              >
                {program}
              </span>
            ))}
          </div>
          <h1 className="font-display max-w-4xl text-4xl text-charcoal md:text-5xl">{video.title}</h1>
          <p className="mt-4 text-sm tracking-[0.03em] text-slate">
            {speakers.join(" · ") || "Holistic Consulting"}
            <span className="mx-2 text-line">|</span>
            {formatPublishedDate(video.publishedAt)}
            {video.durationSec > 0 ? (
              <>
                <span className="mx-2 text-line">|</span>
                {formatDuration(video.durationSec)}
              </>
            ) : null}
          </p>
          {video.description ? (
            <p className="mt-5 max-w-3xl text-sm leading-7 text-slate">{video.description}</p>
          ) : null}
          {topics.length ? (
            <p className="mt-4 text-[0.75rem] tracking-[0.04em] text-slate">
              {topics.join(" · ")}
            </p>
          ) : null}
        </div>

        <WatchWorkspace
          youtubeId={video.youtubeId}
          startSec={initialTime}
          segments={video.segments}
        />
      </div>
    </section>
  );
}
