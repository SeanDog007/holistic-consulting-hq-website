import Link from "next/link";
import { BotanicalMotif } from "@/components/BotanicalMotif";
import { LibraryPagination } from "@/components/LibraryPagination";
import { LibrarySearchForm } from "@/components/LibrarySearchForm";
import { VideoCard } from "@/components/VideoCard";
import { listFilterOptions, searchLibrary, type LibraryFilters } from "@/lib/search";

export const dynamic = "force-dynamic";

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<LibraryFilters>;
}) {
  const filters = await searchParams;
  const [{ results, total, page, pageCount }, options] = await Promise.all([
    searchLibrary(filters),
    listFilterOptions(),
  ]);

  const query = filters.q?.trim() ?? "";
  const transcriptHits = results.reduce((sum, video) => sum + video.hits.length, 0);
  const hasFilters = Boolean(query || filters.program || filters.speaker || filters.year || filters.topic);

  return (
    <>
      <section className="library-hero grid grid-cols-1 lg:grid-cols-2">
        <div className="relative overflow-hidden bg-cream px-6 py-16 md:px-12 md:py-24">
          <BotanicalMotif className="pointer-events-none absolute -bottom-16 -left-10 h-72 w-72 text-emerald/10" />
          <div className="relative max-w-xl">
            <div className="mb-6 flex items-center gap-4">
              <span className="section-label !mb-0">Clinical courses & mentorship</span>
              <span className="h-px w-14 bg-gold" />
            </div>
            <h1 className="font-display text-[3.2rem] leading-[1.05] text-charcoal md:text-[4.4rem]">
              Don&apos;t just watch the call.
              <br />
              <em className="text-emerald italic">Find the moment.</em>
            </h1>
            <p className="mt-6 max-w-md text-base leading-8 text-slate">
              Live lectures, office hours, and community recordings from the Institute. Search
              titles, descriptions, and the words spoken on the recording — then jump the player
              there.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a href="#shelves" className="btn-primary">
                Search recordings
              </a>
              <Link href="/programs.html" className="btn-outline">
                Explore Programs
              </Link>
            </div>
          </div>
        </div>
        <div className="relative hidden min-h-[420px] items-center justify-center overflow-hidden bg-emerald lg:flex">
          <BotanicalMotif className="pointer-events-none absolute -right-8 -bottom-10 h-80 w-80 text-white/10" />
          <div className="relative mx-12 max-w-sm bg-white/10 px-8 py-10 text-cream backdrop-blur-[2px]">
            <div className="mb-5 text-gold">★★★★★</div>
            <blockquote className="font-display text-[1.65rem] leading-snug italic">
              School teaches you what to know. A mentorship teaches you how to practice — and
              gives you the people to practice it with.
            </blockquote>
            <p className="mt-8 text-[0.7rem] font-semibold tracking-[0.16em] text-gold uppercase">
              Holistic Consulting Institute
            </p>
          </div>
        </div>
      </section>

      <section id="shelves" className="bg-sage py-20">
        <div className="container-site space-y-10">
          <div className="max-w-2xl">
            <span className="section-label">The shelves</span>
            <h2 className="font-display text-4xl text-charcoal md:text-5xl">
              Browse by program, speaker, or the words that were said.
            </h2>
          </div>

          <LibrarySearchForm
            filters={filters}
            speakers={options.speakers}
            years={options.years}
            topics={options.topics}
          />

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[0.7rem] font-semibold tracking-[0.18em] text-gold uppercase">
                {hasFilters ? "Matching recordings" : "All recordings"}
              </p>
              <p className="mt-1 text-sm text-slate">
                {total} {total === 1 ? "video" : "videos"}
                {query
                  ? ` · ${transcriptHits} transcript ${transcriptHits === 1 ? "hit" : "hits"} on this page`
                  : null}
                {pageCount > 1 ? ` · page ${page} of ${pageCount}` : null}
              </p>
            </div>
            {hasFilters ? (
              <Link href="/library" className="text-sm font-medium text-emerald hover:underline">
                Clear search and filters
              </Link>
            ) : null}
          </div>

          {results.length === 0 ? (
            <div className="bg-white px-8 py-16 text-center">
              <p className="font-display text-3xl text-charcoal">Nothing on that shelf yet.</p>
              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate">
                Try a broader word, or clear the filters. If this is a new environment, run{" "}
                <code className="text-charcoal">npm run db:seed</code> to load the Brain catalog
                from <code className="text-charcoal">data/brain/</code>.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {results.map((video) => (
                  <VideoCard key={video.id} video={video} query={query} />
                ))}
              </div>
              <LibraryPagination filters={filters} page={page} pageCount={pageCount} />
            </>
          )}
        </div>
      </section>

      <section className="bg-forest-deep py-24 text-cream">
        <div className="container-site grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div>
            <div className="mb-6 flex items-center gap-4">
              <span className="section-label !mb-0">The mentorship difference</span>
              <span className="h-px w-14 bg-gold" />
            </div>
            <h2 className="font-display text-4xl leading-[1.12] md:text-5xl">
              Why a searchable library,
              <br />
              <em className="text-gold italic">not another playlist?</em>
            </h2>
            <p className="mt-6 max-w-lg text-base leading-8 text-cream/70">
              Mentorship happens in the room. The shelves exist so you can return to the exact
              sentence — herbal safety, a first-client offer, a BCHN question — and practice it
              again with your next case.
            </p>
          </div>
          <blockquote className="bg-white/10 px-8 py-10 font-display text-3xl leading-snug text-cream italic">
            “School teaches you what to know. A mentorship teaches you how to practice — and
            gives you the people to practice it with.”
          </blockquote>
        </div>
      </section>
    </>
  );
}
