import Link from "next/link";
import { activeBrowseId, BROWSE_SHELVES } from "@/lib/browse";
import type { LibraryFilters } from "@/lib/search";

function chipClass(active: boolean): string {
  return active
    ? "browse-chip browse-chip-active"
    : "browse-chip";
}

export function LibraryBrowseChips({ filters }: { filters: LibraryFilters }) {
  const active = activeBrowseId(filters);
  const allActive = !active && !filters.recordingType && !filters.program && !filters.browse;

  return (
    <div className="bg-white px-6 py-8 md:px-10 md:py-9">
      <span className="section-label">Browse the Library</span>
      <p className="max-w-2xl font-display text-2xl leading-snug text-charcoal md:text-3xl">
        Start with a shelf — or search below if you already know the words.
      </p>
      <div className="mt-6 flex flex-wrap gap-2" role="list">
        <Link href="/library" className={chipClass(allActive)} role="listitem" aria-current={allActive ? "page" : undefined}>
          All
        </Link>
        {BROWSE_SHELVES.map((shelf) => {
          const isActive = active === shelf.id;
          return (
            <Link
              key={shelf.id}
              href={shelf.href}
              className={chipClass(isActive)}
              role="listitem"
              aria-current={isActive ? "page" : undefined}
            >
              {shelf.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
