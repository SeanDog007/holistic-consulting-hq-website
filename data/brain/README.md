# Brain catalog export

This folder is the durable source of truth for the member `/library` shelf.

- `videos.json` — Studio inventory metadata (include **Unlisted**; do not filter them out)
- `search_chunks.json.gz` — merged ASR/search chunks (~45s / ~800 characters) with `start_sec` / `end_sec` / `text`
- `display-titles.batch-1.json` — official CoS batch 1 (`video_id` → `display_title`). Keys are YouTube ids, not Prisma cuids.
- `display-titles.batch-2.json` — official CoS batch 2, guest/teaching talks in `Topic — Speaker, Credential` form. Optional `speaker` fills `Video.speakers` on import.
- `display-titles.batch-3.json` — official CoS batch 3, topic-polish titles only (no invented speakers). Later `batch-N` files win.
- `display-titles.json` — extra teaching polish not in an official batch. Later `batch-N` files win if both set a title.
- House style: `docs/TITLE-CONVENTION.md`. Library display only; do not rename YouTube from this repo.

### Adding display titles (batch 4+)

1. Drop `data/brain/display-titles.batch-4.json` (then 5, 6, …) in the same shape as batch 2/3:
   `{ "items": [{ "video_id", "display_title", "speaker?" }] }`.
   The loader already globs `display-titles.batch-*.json` and lets the highest N win. No code change.
2. Use an em dash. If the speaker or credential is unknown, improve the series/date only — do not invent credentials. Expand `NGR` to **New Graduate Roundtable**.
3. Run `npm run titles:preview` to confirm each batch id matches the catalog (miss count must be 0) and browse shelves still have videos.
4. Run `npm run db:seed` (or wait for the next production build) so the catalog writes `displayTitle` / `speakers`.

Recurring Business Mastermind, NGR, Community Live, and dated roundtables are cleaned automatically from the raw title/date when no override exists (`src/lib/display-title.ts`).

Browse-chip mapping (Clinical Practice topics vs Program filters) lives in `src/lib/browse.ts`.

The library is an internal member shelf. Keep every row, including `visibility: Unlisted`.

## Refresh from a future export

1. Replace the files in this folder with the new CoS/Studio export:
   - `data/brain/videos.json`
   - `data/brain/search_chunks.json.gz` (or uncompressed `data/brain/search_chunks.json`)
2. From the repo root, reload SQLite/Postgres:

```bash
npm run brain:import
# or
npm run db:seed
```

3. Commit the new export files. The next `npm run build` (Netlify / local production build) runs the same seed and replaces demo or stale rows.

Optional paths if the export lives somewhere else:

```bash
npm run brain:import -- --videos /path/to/videos.json --chunks /path/to/search_chunks.json.gz
```

Do **not** upload captions to YouTube from this repo. This import only writes the local catalog database.
