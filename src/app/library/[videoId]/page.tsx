import Link from "next/link";
import { notFound } from "next/navigation";
import { RelatedContent } from "@/components/RelatedContent";
import { WatchWorkspace } from "@/components/WatchWorkspace";
import { prisma } from "@/lib/db";
import { formatDuration, formatPublishedDate, publicTitle, youtubeWatchUrl } from "@/lib/format";
import { parseJsonArray } from "@/lib/json";
import { relatedRecordingsForVideo } from "@/lib/related";

export const dynamic = "force-dynamic";

export default async function LibraryVideoPage({
  params,
  searchParams,
}: {
  params: Promise<{ videoId: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
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
  const title = publicTitle(video);
  const related = await relatedRecordingsForVideo({
    id: video.id,
    youtubeId: video.youtubeId,
    title: video.title,
    displayTitle: video.displayTitle,
    description: video.description,
    programs,
    topics,
    segments: video.segments,
  });
  const rawTitle = video.title.trim();
  const startSec = Number(t);
  const initialTime = Number.isFinite(startSec) && startSec > 0 ? startSec : 0;

  return (
    <>
      <section className="bg-cream py-12">
        <div className="container-site">
          <Link
            href="/library"
            className="text-[0.75rem] font-semibold tracking-[0.12em] text-gold uppercase"
          >
            ← Back to the shelves
          </Link>
          <div className="mt-6 mb-2">
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
            <h1 className="font-display max-w-4xl text-4xl text-charcoal md:text-5xl">{title}</h1>
            {rawTitle && rawTitle !== title ? (
              <p className="mt-3 max-w-3xl text-xs tracking-[0.03em] text-slate/80">
                YouTube title: {rawTitle}
              </p>
            ) : null}
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
              <p className="mt-4 text-[0.75rem] tracking-[0.04em] text-slate">{topics.join(" · ")}</p>
            ) : null}
            <p className="mt-5">
              <a
                href={youtubeWatchUrl(video.youtubeId, initialTime)}
                target="_blank"
                rel="noreferrer"
                className="text-[0.78rem] font-semibold tracking-[0.08em] text-emerald uppercase hover:underline"
              >
                Open on YouTube{initialTime > 0 ? ` at ${Math.floor(initialTime)}s` : ""} ↗
              </a>
            </p>
          </div>
        </div>
      </section>

      <section className="bg-sage py-12">
        <div className="container-site">
          <WatchWorkspace
            youtubeId={video.youtubeId}
            startSec={initialTime}
            segments={video.segments}
          />
        </div>
      </section>

      <RelatedContent recordings={related} />
    </>
  );
}
