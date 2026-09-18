# Holistic Consulting Institute

Marketing site plus an unlisted member **Recording Library** for live-call and YouTube videos.

The original pages were static HTML (not a Next.js app), so they are a poor fit for search, sessions, and a database. Those files now live in `public/` and still serve at `/`, `/about.html`, `/programs.html`, and the rest. The searchable library is a Next.js App Router app at `/library`.

The **live marketing site** is on **Netlify** (`bespoke-elf-113889`) at [holisticconsultinghq.com](https://holisticconsultinghq.com). Those static pages do **not** link to `/library` (homepage, nav, and footer stay clean). `/library` needs **Next.js hosting** — a static-only Netlify deploy will 404 it. Circle Resource Hub can share the URL with members. Circle SSO is out of scope for v1.

## Recording library

Unlisted: open to anyone with the URL, but not linked from marketing pages. All `/library*` routes send `noindex, nofollow`. The password gate is off.

- `/library` — searchable, paginated catalog with filters (program, speaker, year, topic)
- `/library/[videoId]` — YouTube player + transcript sidebar
- `/library/login` — redirects to the catalog (no password gate)
- Full-text search across titles, descriptions, and **transcript chunks**
- A transcript hit opens the in-app player at that timestamp **and** links to `https://www.youtube.com/watch?v={id}&t={floor(start_sec)}s`

The catalog is the real Brain/Studio inventory (hundreds of recordings, including Unlisted member videos). Do not drop `visibility: Unlisted` on import.

## Local setup

```bash
cp .env.example .env
npm install
npm run db:setup
npm run dev
```

Open [http://localhost:3000/library](http://localhost:3000/library). The catalog is public (no login).

`npm run dev` generates the Prisma client and pushes the SQLite schema. Seed the Brain catalog with `npm run db:setup` or `npm run db:seed` before browsing — request-time seeding is disabled because the transcript store is large.

### Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Local: `file:./dev.db` (SQLite, relative to `prisma/`). Netlify: a Postgres URL (Neon / Prisma Postgres). |
| `YOUTUBE_API_KEY` | For ingest only | YouTube Data API v3 key. Brain seed works without it. |
| `YOUTUBE_CHANNEL_HANDLE` | No | Defaults to `HolisticConsulting`. |

## Brain catalog vs YouTube ingest

**Brain catalog** (committed under `data/brain/`, no API key): Studio inventory metadata plus merged ASR search chunks.

```bash
npm run db:seed
# or
npm run brain:import
```

Refresh from a future CoS/Studio export:

1. Replace `data/brain/videos.json` and `data/brain/search_chunks.json.gz` (uncompressed `.json` is also accepted).
2. Run `npm run brain:import` (or `npm run db:seed`).
3. Commit the new export files. The next production `npm run build` re-seeds the database.

Optional: `npm run brain:import -- --videos /path/to/videos.json --chunks /path/to/search_chunks.json.gz`

See `data/brain/README.md`. Unlisted videos stay in the member shelf. This repo does not upload captions to YouTube.

**Live ingest** from [youtube.com/@HolisticConsulting](https://www.youtube.com/@HolisticConsulting) (public uploads only — it will miss Unlisted member recordings):

```bash
# .env must include YOUTUBE_API_KEY
npm run ingest
npm run ingest -- --max 10
npm run ingest -- --handle HolisticConsulting --skip-captions
```

Ingest uses the YouTube Data API for video metadata, then pulls public caption / timed-text tracks into `TranscriptSegment` rows `{ startMs, endMs?, text }`. Official caption *download* requires OAuth; public timed text is used instead. Videos without captions are stored without segments.

Program, speaker, and topic fields are classified from titles (and the Brain `program` field when present). Edit them in the database after import if a talk needs a different shelf.

## Data model

Prisma models (SQLite locally, Postgres on Netlify):

- `Video` — `youtubeId`, `title`, `description`, `publishedAt`, `durationSec`, `thumbnailUrl`, `speakers`, `programs`, `topics`, `source`
- `TranscriptSegment` — `videoId`, `startMs`, `endMs?`, `text` (Brain chunks are stored here; `start_sec` / `end_sec` from the export are converted to milliseconds)

`speakers`, `programs`, and `topics` are JSON arrays stored as strings so the same fields work on SQLite and Postgres.

Production uses `prisma/schema.postgres.prisma` whenever `DATABASE_URL` starts with `postgres`. `npm run build` generates the client, pushes the schema, and seeds the Brain catalog.

## Deploy notes (Netlify)

Live site: **Netlify** site `bespoke-elf-113889` → [holisticconsultinghq.com](https://holisticconsultinghq.com). Do **not** change DNS. Do **not** deploy this repo to the Old City Swim School Vercel team.

1. Production branch is `main`. `netlify.toml` runs `npm run build` (Next.js + `@netlify/plugin-nextjs`).
2. In Netlify → Site configuration → Environment variables, set `DATABASE_URL` to the Netlify/Postgres connection string when needed (`NETLIFY_DB_URL` is used automatically on this site).
3. Trigger a production deploy from `main`. Build seeds the Brain catalog from `data/brain/`.
4. Confirm `https://holisticconsultinghq.com/library` is 200 with no login. Homepage / nav / footer must not mention `/library`.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Generate Prisma client, push schema, start Next.js |
| `npm run db:setup` | Push schema and seed the Brain catalog |
| `npm run db:seed` | Replace the catalog from `data/brain/` |
| `npm run brain:import` | Same import; accepts `--videos` and `--chunks` |
| `npm run ingest` | Pull the public YouTube channel when `YOUTUBE_API_KEY` is set |
| `npm run build` | Production build (generate, push, seed, next build) |
