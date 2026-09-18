import { PROGRAMS } from "@/lib/programs";
import type { LibraryFilters } from "@/lib/search";

export function LibrarySearchForm({
  filters,
  speakers,
  years,
  topics,
}: {
  filters: LibraryFilters;
  speakers: string[];
  years: number[];
  topics: string[];
}) {
  return (
    <form action="/library" method="get" className="relative bg-white px-6 py-8 md:px-10 md:py-10">
      {filters.browse ? <input type="hidden" name="browse" value={filters.browse} /> : null}
      <span className="pathway-num absolute top-4 right-6" aria-hidden>
        01
      </span>
      <label className="section-label" htmlFor="library-q">
        Search the shelves
      </label>
      <div className="relative flex flex-col gap-3 md:flex-row">
        <input
          id="library-q"
          name="q"
          defaultValue={filters.q ?? ""}
          placeholder="Search titles, descriptions, and spoken words…"
          className="field flex-1"
        />
        <button type="submit" className="btn-primary whitespace-nowrap">
          Search recordings
        </button>
      </div>
      <div className="relative mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block">
          <span className="mb-2 block text-[0.65rem] font-semibold tracking-[0.14em] text-slate uppercase">
            Program
          </span>
          <select name="program" defaultValue={filters.program ?? ""} className="field">
            <option value="">All programs</option>
            {PROGRAMS.map((program) => (
              <option key={program} value={program}>
                {program}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-[0.65rem] font-semibold tracking-[0.14em] text-slate uppercase">
            Speaker
          </span>
          <select name="speaker" defaultValue={filters.speaker ?? ""} className="field">
            <option value="">All speakers</option>
            {speakers.map((speaker) => (
              <option key={speaker} value={speaker}>
                {speaker}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-[0.65rem] font-semibold tracking-[0.14em] text-slate uppercase">
            Year
          </span>
          <select name="year" defaultValue={filters.year ?? ""} className="field">
            <option value="">All years</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-[0.65rem] font-semibold tracking-[0.14em] text-slate uppercase">
            Topic
          </span>
          <select name="topic" defaultValue={filters.topic ?? ""} className="field">
            <option value="">All topics</option>
            {topics.map((topic) => (
              <option key={topic} value={topic}>
                {topic}
              </option>
            ))}
          </select>
        </label>
      </div>
    </form>
  );
}
