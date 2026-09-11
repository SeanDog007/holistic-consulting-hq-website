import Link from "next/link";
import { LibrarySearchForm } from "@/components/LibrarySearchForm";
import { VideoCard } from "@/components/VideoCard";
import { ensureDemoData } from "@/lib/ensure-data";
import { listFilterOptions, searchLibrary, type LibraryFilters } from "@/lib/search";

export const dynamic = "force-dynamic";

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<LibraryFilters>;
}) {
  await ensureDemoData();
  const filters = await searchParams;
  const [results, options] = await Promise.all([
    searchLibrary(filters),
    listFilterOptions(),
  ]);

  const query = filters.q?.trim() ?? "";
  const transcriptHits = results.reduce((sum, video) => sum + video.hits.length, 0);
  const hasFilters = Boolean(query || filters.program || filters.speaker || filters.year || filters.topic);

  return (
    <>
      <section className="bg-warm-gray pt-16 pb-14">
        <div className="container-site">
          <span className="section-label">Recording library</span>
          <div className="gold-line" />
          <h1 className="font-display max-w-3xl text-5xl text-charcoal md:text-6xl">
            The shelves.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate">
            Browse live calls, lectures, and office hours from the Institute. Search titles,
            descriptions, and the words spoken on the recording — then jump the player to that
            moment.
          </p>
        </div>
      </section>

      <section className="-mt-8 pb-20">
        <div className="container-site space-y-8">
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
                {results.length} {results.length === 1 ? "video" : "videos"}
                {query
                  ? ` · ${transcriptHits} transcript ${transcriptHits === 1 ? "hit" : "hits"}`
                  : null}
              </p>
            </div>
            {hasFilters ? (
              <Link href="/library" className="text-sm font-medium text-emerald hover:underline">
                Clear search and filters
              </Link>
            ) : null}
          </div>

          {results.length === 0 ? (
            <div className="border border-line bg-white px-8 py-16 text-center">
              <p className="font-display text-3xl text-charcoal">Nothing on that shelf yet.</p>
              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate">
                Try a broader word, or clear the filters. If this is a new environment, run{" "}
                <code className="text-charcoal">npm run db:seed</code> for the demo catalog, or{" "}
                <code className="text-charcoal">npm run ingest</code> once a YouTube API key is
                set.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {results.map((video) => (
                <VideoCard key={video.id} video={video} query={query} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
