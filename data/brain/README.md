# Brain catalog export

This folder is the durable source of truth for the member `/library` shelf.

- `videos.json` — Studio inventory metadata (include **Unlisted**; do not filter them out)
- `search_chunks.json.gz` — merged ASR/search chunks (~45s / ~800 characters) with `start_sec` / `end_sec` / `text`

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
