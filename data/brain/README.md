# Brain catalog export

This folder is the durable source of truth for the member `/library` shelf.

Brand identity documents (February 2026) live in `data/brain/brand/`. They are a reference corpus for CoS. They are not seeded into the recording search index. See `data/brain/brand/README.md`.

- `videos.json` — Studio inventory metadata (include **Unlisted**; do not filter them out)
- `search_chunks.json.gz` — merged ASR/search chunks (~45s / ~800 characters) with `start_sec` / `end_sec` / `text`
- `embeddings.json.gz` — baked sentence vectors for hybrid `/library` search (`npm run brain:embed`). Default provider `local-minilm-l6-v2`. Optional OpenAI if `OPENAI_API_KEY` is set at embed time.
- `display-titles.batch-1.json` — official CoS batch 1 (`video_id` → `display_title`). Keys are YouTube ids, not Prisma cuids.
- `display-titles.batch-2.json` — official CoS batch 2, guest/teaching talks in `Topic — Speaker, Credential` form. Optional `speaker` fills `Video.speakers` on import.
- `display-titles.batch-3.json` — official CoS batch 3, topic-polish titles only (no invented speakers).
- `display-titles.batch-4.json` — official CoS batch 4, early-transcript roster hits in `Topic — Speaker, Credential` form.
- `display-titles.batch-5.json` — official CoS batch 5, series/date cleanups (NGR, Grand Rounds, Q&A, live calls).
- `display-titles.batch-6.json` — official CoS batch 6, Intro to Herbalism and guest-module polish.
- `display-titles.batch-7.json` — official CoS batch 7, short orphans and topic polish.
- `display-titles.batch-8.json` — official CoS batch 8, Zoom `Recording —` dates, roundtables, GI, and the rest of the prior catalog. Later `batch-N` files win.
- `display-titles.batch-9.json` — official CoS batch 9, Grand Rounds — Sep 17, 2026 (`VXGZZirK56I`). Later `batch-N` files win.
- `display-titles.batch-10.json` — official CoS batch 10, Cancer, Angiogenesis, and Nutrition — William Li (`OjkzfeJz66o`). Later `batch-N` files win.
- `display-titles.batch-11.json` — official CoS batch 11, the 2026-09-25 export's 13 new rows (display title = export `title`). Later `batch-N` files win.
- `display-titles.json` — extra teaching polish not in an official batch. Empty while batches 1–11 cover every video (399). Later `batch-N` files win if both set a title.
- House style: `docs/TITLE-CONVENTION.md`. Library display only; do not rename YouTube from this repo. Pending Studio renames are listed in `docs/STUDIO-RENAME.csv` and are not applied here.

### Adding display titles (batch 11+)

1. Drop `data/brain/display-titles.batch-11.json` (then 12, 13, …) in the same shape as batch 2/4:
   `{ "items": [{ "video_id", "display_title", "speaker?" }] }`.
   The loader already globs `display-titles.batch-*.json` and lets the highest N win. No code change.
2. Use an em dash. If the speaker or credential is unknown, improve the series/date only — do not invent credentials. Expand `NGR` to **New Graduate Roundtable**.
3. Run `npm run titles:preview` to confirm each batch id matches the catalog (miss count must be 0) and browse shelves still have videos.
4. Run `npm run db:seed` (or wait for the next production build) so the catalog writes `displayTitle` / `speakers`.

Recurring Business Mastermind, NGR, Community Live, and dated roundtables are cleaned automatically from the raw title/date when no override exists (`src/lib/display-title.ts`).

Browse-chip mapping (Clinical Practice topics vs Program filters) lives in `src/lib/browse.ts`.

The library is an internal member shelf. Keep every row, including `visibility: Unlisted`.

## YouTube ids already swapped in production (2026-09-22)

Production Prisma `Video.youtubeId` was updated in place before this catalog change. The cuids below did not change. `npm run build` / `brain:import` upserts on `youtubeId` and then deletes videos that are absent from this export, so these files keep the new ids and the next seed updates the existing rows.

| Title | cuid (unchanged) | youtube id |
| --- | --- | --- |
| Four Pillars of Restorative Sleep | `cmu786seg000nff1uj45qr8sr` | `gxBYKliBTQo` |
| Program Welcome | `cmu786sct0002ff1u2cmn5g26` | `9q3G6_6kBMs` |
| The Science of Sporebiotics | `cmu786sft002vff1ukkzmegkr` | `JgOgrLEtnq4` |
| Nutrigenomics — Val | `cmu786sf5001gff1ui7d11jcw` | `S_DNS7Sqy3E` |
| Herbalism for PCOS — Betsy Miller, Registered Herbalist | `cmu786sfb001xff1ump0altkk` | `n2WJDN4pRhg` |
| NGR 2 25 2026 Constipation and Sunflower Syndrome | `cmu786sft002wff1uvnyghu59` | `dzRQOja73wo` |
| Advancing Your Nutrition Career (MS & CNS) — Dr. Kim Ross | `cmu786sdn000dff1ukaggbedk` | `maGyvt-nzHI` |

Previous ids were `oO8GHOvelOM`, `UcjRDYFOZP0`, `ableUZwkl5w`, `T3svpVLeYSg`, `h3FpTLE2oGg`, `YtzYbcU0IRA`, `IJMwtHCnTxc`, and `7D2ddTLxZlk`. Herbalism for PCOS was briefly `39pQ1xBoJy8`; production reverted that row to `7D2ddTLxZlk` because the replacement upload was cancelled, then moved it to `n2WJDN4pRhg` on 2026-09-25. ATM Framework's live id is `2Iy0Fjo07OQ` (was `IJMwtHCnTxc`). The same ids are remapped in `videos.json` (including `youtube_url`), `search_chunks.json.gz`, `embeddings.json.gz`, and the display-title batches that key these talks. A later Studio export that still lists the previous ids would insert those rows and delete the live ones.

## Refresh 2026-09-25

Website export: **399 videos / 30,851 chunks**. That is every production YouTube id (398) plus `5rY0UI4z6Qc` (Behavior Change Strategies for Nutrition Professionals). `brain:import` upserts on `youtubeId` and deletes videos absent from `videos.json`, so this file keeps every production id.

Overnight production rows now in the catalog (export `title` is the live display title, `rawTitle` is the Studio title): `vRXWVpasSgI`, `A5kMpf3X_Dc`, `4fqgSu9C-Oc`, `zhaXP6G58hI`, `JWXoyRZosX8`, `P7fS78g0Rg0`, `9tZJO0T456s`, `_RL0Za8LV1g`, `CFkIP-JfMCI`, `cvW1ZBCwtGU`, `opUImjBPF6s`, `UBxBsUmy7i8`. Community Live rows stay recording type Community Live with speaker Dr. David Feuz. `4fqgSu9C-Oc` is Community Live — Oct 15, 2025 (Studio title David's Zoom Room — Oct 15, 2025).

Held back from the box export: superseded ids above, plus two Personal Meeting Room — Mar 27, 2026 uploads (`xQKN-h6AgSs`, `frRAmHVfLgY`).

## Refresh from a future export

1. Replace the files in this folder with the new CoS/Studio export:
   - `data/brain/videos.json`
   - `data/brain/search_chunks.json.gz` (or uncompressed `data/brain/search_chunks.json`)
2. From the repo root, reload SQLite/Postgres:

```bash
npm run brain:embed
npm run brain:retrieve:verify
npm run brain:import
# or
npm run db:seed
```

3. Commit the new export files **and** `data/brain/embeddings.json.gz`. The next `npm run build` (Netlify / local production build) re-seeds the database and ships the committed vector index. Production does not re-embed the corpus. MiniLM query encode is local ($0). OpenAI query encode needs `OPENAI_API_KEY` on Netlify only if the committed provider is OpenAI.

Optional paths if the export lives somewhere else:

```bash
npm run brain:import -- --videos /path/to/videos.json --chunks /path/to/search_chunks.json.gz
```

Do **not** upload captions to YouTube from this repo. This import only writes the local catalog database.
