# Holistic Consulting Institute

Marketing site plus a member **Recording Library** for live-call and YouTube videos.

The original pages were static HTML (not a Next.js app), so they are a poor fit for search, sessions, and a database. Those files now live in `public/` and still serve at `/`, `/about.html`, `/programs.html`, and the rest. The searchable library is a Next.js App Router app at `/library`.

Circle Resource Hub can link members here. Circle SSO is out of scope for v1.

## Recording library

- `/library` — searchable catalog with filters (program, speaker, year, topic)
- `/library/[videoId]` — YouTube player + transcript sidebar
- Full-text search across titles, descriptions, and **transcript segments**
- A transcript hit opens the recording at that timestamp
- Member gate: shared password in `LIBRARY_PASSWORD` (cookie session)

## Local setup

```bash
cp .env.example .env
npm install
npm run db:setup
npm run dev
```

Open [http://localhost:3000/library](http://localhost:3000/library). Default demo password is `institute` (from `.env.example`).

`npm run dev` generates the Prisma client and pushes the SQLite schema. If the catalog is empty, the library page seeds the demo catalog automatically.

### Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `LIBRARY_PASSWORD` | For the member gate | Shared password. If unset, `/library` is open (local/dev only). |
| `DATABASE_URL` | Yes | Local default: `file:./dev.db` (SQLite, relative to `prisma/`). |
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

Prisma models (SQLite locally, Postgres-ready types):

- `Video` — `youtubeId`, `title`, `description`, `publishedAt`, `durationSec`, `thumbnailUrl`, `speakers`, `programs`, `topics`, `source`
- `TranscriptSegment` — `videoId`, `startMs`, `endMs?`, `text`

`speakers`, `programs`, and `topics` are JSON arrays stored as strings so the same schema works on SQLite and Postgres.

To move to Postgres (recommended on Vercel):

1. Change `provider = "postgresql"` in `prisma/schema.prisma`
2. Set `DATABASE_URL` to a Postgres URL (Neon, Prisma Postgres, etc.)
3. Run `npx prisma db push` (or a migration) and `npm run db:seed` or `npm run ingest`

## Deploy notes

Do **not** point production DNS at a preview of this work unless you intend to. Suggested path when you are ready:

1. Import the GitHub repo into Vercel (or connect the existing project).
2. Set `LIBRARY_PASSWORD` and a Postgres `DATABASE_URL`.
3. Set `YOUTUBE_API_KEY` only if you will run ingest in that environment.
4. Build command: `npm run build` (`prisma generate && next build`).
5. After the first deploy, run `npm run db:setup` or `npm run ingest` against that database (Vercel CLI / a one-off job). SQLite will not persist on serverless.

The marketing HTML in `public/` continues to serve at the existing `.html` paths. `/` rewrites to the current homepage.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Generate Prisma client, push schema, start Next.js |
| `npm run db:setup` | Push schema and seed the demo catalog |
| `npm run db:seed` | Re-upsert demo videos and transcript segments |
| `npm run ingest` | Pull the YouTube channel when `YOUTUBE_API_KEY` is set |
| `npm run build` | Production build |
