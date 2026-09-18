import { NextResponse } from "next/server";
import { publicTitle, youtubeWatchUrl } from "@/lib/format";
import { searchLibrary, type LibraryFilters } from "@/lib/search";
import { loadVectorIndex } from "@/lib/vector-index";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function firstString(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

/**
 * Internal CoS retrieve API. Citations only — no unsourced synthesis.
 * Same hybrid ranking as `/library?q=`.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const filters: LibraryFilters = {
    q: firstString(url.searchParams.get("q") ?? undefined),
    browse: firstString(url.searchParams.get("browse") ?? undefined),
    program: firstString(url.searchParams.get("program") ?? undefined),
    speaker: firstString(url.searchParams.get("speaker") ?? undefined),
    year: firstString(url.searchParams.get("year") ?? undefined),
    topic: firstString(url.searchParams.get("topic") ?? undefined),
    page: firstString(url.searchParams.get("page") ?? undefined),
  };

  const query = filters.q?.trim() ?? "";
  if (!query) {
    return NextResponse.json(
      { error: "Missing q. Pass a question or search phrase." },
      { status: 400, headers: { "X-Robots-Tag": "noindex, nofollow" } },
    );
  }

  const page = await searchLibrary(filters);
  const index = loadVectorIndex();

  return NextResponse.json(
    {
      query,
      provider: index?.provider ?? null,
      semanticUsed: page.semanticUsed,
      total: page.total,
      page: page.page,
      pageCount: page.pageCount,
      note: "Cited clips only. Do not treat retrieved text as clinical advice.",
      results: page.results.map((video) => {
        const title = publicTitle(video);
        return {
          id: video.id,
          youtubeId: video.youtubeId,
          title,
          rawTitle: video.title,
          speakers: video.speakers,
          programs: video.programs,
          libraryPath: `/library/${video.id}`,
          score: video.score,
          hits: video.hits.map((hit) => {
            const startSec = Math.floor(hit.startMs / 1000);
            return {
              startSec,
              endSec: hit.endMs != null ? Math.floor(hit.endMs / 1000) : null,
              source: hit.source ?? "keyword",
              text: hit.text,
              libraryUrl: `/library/${video.id}?t=${startSec}`,
              youtubeUrl: youtubeWatchUrl(video.youtubeId, startSec),
            };
          }),
        };
      }),
    },
    {
      headers: { "X-Robots-Tag": "noindex, nofollow" },
    },
  );
}
