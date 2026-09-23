import Image from "next/image";
import Link from "next/link";
import { formatDuration, publicTitle } from "@/lib/format";
import type { RelatedRecording } from "@/lib/related";

export function RelatedContent({ recordings }: { recordings: RelatedRecording[] }) {
  if (recordings.length === 0) return null;

  return (
    <section className="border-t border-line bg-cream py-14" aria-labelledby="related-content-heading">
      <div className="container-site">
        <h2 id="related-content-heading" className="font-display text-4xl text-charcoal md:text-5xl">
          Related Content
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {recordings.map((video) => {
            const title = publicTitle(video);
            const href = `/library/${video.id}`;
            return (
              <article key={video.id} className="flex h-full min-w-0 flex-col bg-white">
                <Link href={href} className="relative block overflow-hidden bg-forest">
                  {video.thumbnailUrl ? (
                    <Image
                      src={video.thumbnailUrl}
                      alt={title}
                      width={640}
                      height={360}
                      className="aspect-video w-full object-cover transition-transform duration-300 hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="aspect-video w-full bg-forest" />
                  )}
                  {video.durationSec > 0 ? (
                    <span className="absolute right-3 bottom-3 bg-charcoal/85 px-2 py-1 text-[0.7rem] font-medium tracking-wide text-cream">
                      {formatDuration(video.durationSec)}
                    </span>
                  ) : null}
                </Link>
                <div className="flex flex-1 flex-col px-6 py-6">
                  {video.programs.length > 0 ? (
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
                  ) : null}
                  <h3 className="font-display text-[1.45rem] leading-snug break-words text-charcoal">
                    <Link href={href} className="hover:text-emerald">
                      {title}
                    </Link>
                  </h3>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
