import Link from "next/link";
import type { LibraryFilters } from "@/lib/search";

function hrefForPage(filters: LibraryFilters, page: number): string {
  const params = new URLSearchParams();
  if (filters.q?.trim()) params.set("q", filters.q.trim());
  if (filters.program) params.set("program", filters.program);
  if (filters.speaker) params.set("speaker", filters.speaker);
  if (filters.year) params.set("year", filters.year);
  if (filters.topic) params.set("topic", filters.topic);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/library?${query}` : "/library";
}

export function LibraryPagination({
  filters,
  page,
  pageCount,
}: {
  filters: LibraryFilters;
  page: number;
  pageCount: number;
}) {
  if (pageCount <= 1) return null;

  const windowStart = Math.max(1, page - 2);
  const windowEnd = Math.min(pageCount, windowStart + 4);
  const pages = [];
  for (let value = windowStart; value <= windowEnd; value += 1) pages.push(value);

  return (
    <nav aria-label="Library pages" className="flex flex-wrap items-center justify-center gap-2 pt-4">
      {page > 1 ? (
        <Link href={hrefForPage(filters, page - 1)} className="btn-outline !px-4 !py-2 text-sm">
          Previous
        </Link>
      ) : (
        <span className="px-4 py-2 text-sm text-slate/50">Previous</span>
      )}
      {pages.map((value) =>
        value === page ? (
          <span
            key={value}
            className="bg-forest px-3 py-2 text-sm font-medium text-cream"
            aria-current="page"
          >
            {value}
          </span>
        ) : (
          <Link
            key={value}
            href={hrefForPage(filters, value)}
            className="bg-white px-3 py-2 text-sm text-charcoal hover:bg-sage"
          >
            {value}
          </Link>
        ),
      )}
      {page < pageCount ? (
        <Link href={hrefForPage(filters, page + 1)} className="btn-outline !px-4 !py-2 text-sm">
          Next
        </Link>
      ) : (
        <span className="px-4 py-2 text-sm text-slate/50">Next</span>
      )}
    </nav>
  );
}
