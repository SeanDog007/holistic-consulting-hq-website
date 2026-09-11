import Image from "next/image";
import Link from "next/link";
import { HighlightedText } from "@/components/HighlightedText";
import { formatDuration, formatPublishedDate, formatTimestamp } from "@/lib/format";
import type { LibraryResult } from "@/lib/search";

export function VideoCard({ video, query }: { video: LibraryResult; query?: string }) {
  return (
    <article className="flex h-full flex-col bg-white">
      <Link href={`/library/${video.id}`} className="relative block overflow-hidden bg-forest">
        <Image
          src={video.thumbnailUrl}
          alt={video.title}
          width={640}
          height={360}
          className="aspect-video w-full object-cover transition-transform duration-300 hover:scale-[1.03]"
        />
        {video.durationSec > 0 ? (
          <span className="absolute right-3 bottom-3 bg-forest-deep/85 px-2 py-1 text-[0.7rem] font-medium tracking-wide text-cream">
            {formatDuration(video.durationSec)}
          </span>
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col px-7 py-8">
        <div className="mb-3 flex flex-wrap gap-3">
          {video.programs.map((program) => (
            <span
              key={program}
              className="text-[0.65rem] font-semibold tracking-[0.14em] text-gold uppercase"
            >
              {program}
            </span>
          ))}
        </div>
        <h3 className="font-display text-[1.7rem] leading-snug text-charcoal">
          <Link href={`/library/${video.id}`} className="hover:text-emerald">
            <HighlightedText text={video.title} query={query} />
          </Link>
        </h3>
        <p className="mt-3 text-[0.78rem] tracking-[0.04em] text-slate">
          {video.speakers.join(" · ") || "Holistic Consulting"}
          <span className="mx-2 text-line">|</span>
          {formatPublishedDate(video.publishedAt)}
        </p>
        <p className="mt-4 line-clamp-3 text-sm leading-7 text-slate">
          <HighlightedText text={video.description} query={query} />
        </p>
        {video.hits.length > 0 ? (
          <div className="mt-6 space-y-3 border-t border-line pt-5">
            {video.hits.map((hit) => (
              <Link
                key={`${video.id}-${hit.startMs}`}
                href={`/library/${video.id}?t=${Math.floor(hit.startMs / 1000)}`}
                className="block bg-sage px-4 py-3 transition-colors hover:bg-sage-deep"
              >
                <span className="text-[0.65rem] font-semibold tracking-[0.14em] text-gold uppercase">
                  Transcript · {formatTimestamp(hit.startMs)}
                </span>
                <p className="mt-1 text-sm leading-6 text-charcoal">
                  “<HighlightedText text={hit.text} query={query} />”
                </p>
              </Link>
            ))}
          </div>
        ) : null}
        <Link
          href={`/library/${video.id}`}
          className="mt-6 text-[0.78rem] font-semibold tracking-[0.08em] text-gold uppercase hover:text-gold-lt"
        >
          Open recording →
        </Link>
      </div>
    </article>
  );
}
