# Holistic Consulting Institute

Marketing site plus an unlisted member **Recording Library** for live-call and YouTube videos.

The original pages were static HTML (not a Next.js app), so they are a poor fit for search, sessions, and a database. Those files now live in `public/` and still serve at `/`, `/about.html`, `/programs.html`, and the rest. The searchable library is a Next.js App Router app at `/library`.

The **live marketing site** is on **Netlify** (`bespoke-elf-113889`) at [holisticconsultinghq.com](https://holisticconsultinghq.com). Those static pages do **not** link to `/library` (homepage, nav, and footer stay clean). `/library` needs **Next.js hosting** — a static-only Netlify deploy will 404 it. Circle Resource Hub can share the URL with members. Circle SSO is out of scope for v1.

## Recording library

Unlisted: only people with the URL (plus the password) should find it.

- `/library` — searchable catalog with filters (program, speaker, year, topic)
- `/library/[videoId]` — YouTube player + transcript sidebar
- `/library/login` — password gate
- Full-text search across titles, descriptions, and **transcript segments**
- A transcript hit opens the recording at that timestamp
- Member gate: `LIBRARY_PASSWORD` (cookie session)
- All `/library*` routes send `noindex, nofollow`

## Local setup

```bash
cp .env.example .env
npm install
npm run db:setup
npm run dev
```

Open [http://localhost:3000/library](http://localhost:3000/library). Default local password is `institute` (from `.env.example`).

`npm run dev` generates the Prisma client and pushes the SQLite schema. If the catalog is empty, the library page seeds the demo catalog automatically.

### Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `LIBRARY_PASSWORD` | Yes on Netlify | Shared password. Comma-separated values are all accepted. Hosted deploys are always gated. |
| `DATABASE_URL` | Yes | Local: `file:./dev.db` (SQLite, relative to `prisma/`). Netlify: a Postgres URL (Neon / Prisma Postgres). |
| `YOUTUBE_API_KEY` | For ingest only | YouTube Data API v3 key. Demo seed works without it. |
| `YOUTUBE_CHANNEL_HANDLE` | No | Defaults to `HolisticConsulting`. |

## Demo seed vs YouTube ingest

**Demo catalog** (no API key): real `@HolisticConsulting` video IDs plus curated transcript segments so search and timestamp jumps work immediately.

```bash
npm run db:seed
```

**Live ingest** from [youtube.com/@HolisticConsulting](https://www.youtube.com/@HolisticConsulting):

```bash
# .env must include YOUTUBE_API_KEY
npm run ingest
npm run ingest -- --max 10
npm run ingest -- --handle HolisticConsulting --skip-captions
```

Ingest uses the YouTube Data API for video metadata, then pulls public caption / timed-text tracks into `TranscriptSegment` rows `{ startMs, endMs?, text }`. Official caption *download* requires OAuth; public timed text is used instead. Videos without captions are stored without segments.

Program, speaker, and topic fields are classified from titles and descriptions (Mentorship, Community, Herbalism, Business, BCHN, Office Hours, Other). Edit them in the database after ingest if a talk needs a different shelf.

## Data model

Prisma models (SQLite locally, Postgres on Netlify):

- `Video` — `youtubeId`, `title`, `description`, `publishedAt`, `durationSec`, `thumbnailUrl`, `speakers`, `programs`, `topics`, `source`
- `TranscriptSegment` — `videoId`, `startMs`, `endMs?`, `text`

`speakers`, `programs`, and `topics` are JSON arrays stored as strings so the same fields work on SQLite and Postgres.

Production uses `prisma/schema.postgres.prisma` whenever `DATABASE_URL` starts with `postgres`. `npm run build` generates the client, pushes the schema, and seeds the catalog.

## Deploy notes (Netlify)

Live site: **Netlify** site `bespoke-elf-113889` → [holisticconsultinghq.com](https://holisticconsultinghq.com). Do **not** change DNS. Do **not** deploy this repo to the Old City Swim School Vercel team.

1. Production branch is `main`. `netlify.toml` runs `npm run build` (Next.js + `@netlify/plugin-nextjs` auto runtime).
2. In Netlify → Site configuration → Environment variables, set:
   - `LIBRARY_PASSWORD` — a strong production password (not committed). Comma-separate `institute` only if you still want the old demo password to work.
   - `DATABASE_URL` — Neon / Prisma Postgres connection string (pooled + `sslmode=require`).
3. Trigger a production deploy from `main`. Build seeds the 21-video catalog.
4. Confirm `https://holisticconsultinghq.com/library/login` is 200 and ungated `/library` redirects to login. Homepage / nav / footer must not mention `/library`.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Generate Prisma client, push schema, start Next.js |
| `npm run db:setup` | Push schema and seed the demo catalog |
| `npm run db:seed` | Re-upsert demo videos and transcript segments |
| `npm run ingest` | Pull the YouTube channel when `YOUTUBE_API_KEY` is set |
| `npm run build` | Production build (generate, push, seed, next build) |
