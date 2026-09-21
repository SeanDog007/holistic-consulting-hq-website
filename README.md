# Holistic Consulting Institute

Marketing site plus an unlisted member **Recording Library** for live-call and YouTube videos.

The original pages were static HTML (not a Next.js app), so they are a poor fit for search, sessions, and a database. Those files now live in `public/` and still serve at `/`, `/about.html`, `/programs.html`, and the rest. The searchable library is a Next.js App Router app at `/library`.

The **live marketing site** is on **Netlify** (`bespoke-elf-113889`) at [holisticconsultinghq.com](https://holisticconsultinghq.com). Those static pages do **not** link to `/library` (homepage, nav, and footer stay clean). `/library` needs **Next.js hosting** — a static-only Netlify deploy will 404 it. Circle Resource Hub can share the URL with members. Circle SSO is out of scope for v1.

## Recording library

Unlisted: open to anyone with the URL, but not linked from marketing pages. All `/library*` routes send `noindex, nofollow`. The password gate is off.

- `/library` — searchable, paginated catalog with **Browse the Library** chips plus filters (program, speaker, year, topic)
- `/library/[videoId]` — YouTube player + transcript sidebar
- `/library/ask` — unlisted noindex CoS Q&A (cited clips + short synthesis)
- `/library/login` — redirects to the catalog (no password gate)
- Hybrid search: keyword **and** sentence embeddings over transcript windows (max 2 cited clips / video)
- A transcript hit opens the in-app player at that timestamp **and** links to `https://www.youtube.com/watch?v={id}&t={floor(start_sec)}s`
- Internal retrieve API: `GET /api/library/search?q=` (citations only; see `docs/BRAIN-BOT-V1.md`)
- Internal ask API: `POST /api/brain/ask` with `{ question }` (see `docs/BRAIN-QA-V1.md`)

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
| `BRAIN_EMBED_PROVIDER` | No | `auto` (default), `minilm`, `openai`, or `tfidf`. `auto` uses OpenAI only when `OPENAI_API_KEY` is set, otherwise MiniLM. |
| `OPENAI_API_KEY` | No | Embeddings: if set at `npm run brain:embed`, bake `openai-text-embedding-3-small-v1` (512-d). Also required on Netlify to embed those queries. Missing key → MiniLM, then TF-IDF. Q&A: optional synthesis from retrieved clips (template summary if unset). Do not invent a key. |
| `OPENAI_EMBEDDING_MODEL` | No | Default `text-embedding-3-small`. |
| `OPENAI_EMBEDDING_DIM` | No | Default `512`. |
| `ANTHROPIC_API_KEY` | No | Optional. `POST /api/brain/ask` can synthesize from retrieved clips; OpenAI is preferred if both keys are present. |

## Brain catalog vs YouTube ingest

**Brain catalog** (committed under `data/brain/`, no API key): Studio inventory metadata plus merged ASR search chunks.

```bash
npm run db:seed
# or
npm run brain:import
```

Refresh from a future CoS/Studio export:

1. Replace `data/brain/videos.json` and `data/brain/search_chunks.json.gz` (uncompressed `.json` is also accepted).
2. Run `npm run brain:embed` then `npm run brain:retrieve:verify` then `npm run brain:import` (or `npm run db:seed`).
3. Commit the new export files **and** `data/brain/embeddings.json.gz`. The next production `npm run build` re-seeds the database and downloads MiniLM if that is the committed provider.

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

- `Video` — `youtubeId`, `title`, optional `displayTitle`, `description`, `publishedAt`, `durationSec`, `thumbnailUrl`, `speakers`, `programs`, `topics`, `source`

Public cards and the watch page prefer `displayTitle` when set; the raw YouTube `title` stays as fallback and is shown in small type on the detail page for debugging.

## Browse chips (`/library`)

The chips sit above the search form. They are exploration shortcuts; the full search + dropdowns stay below. Mapping (see `src/lib/browse.ts`):

| Chip | Query | What it matches |
| --- | --- | --- |
| All | `/library` | Clears browse and filters |
| Clinical Practice | `browse=clinical` | Clinical teaching talks via topics (`digestive health`, `microbiome`, `functional testing`, `supplements`) and catalog title keywords (GI, SIBO, labs, thyroid, etc.). Excludes Mastermind dumps and testimonials. Not a Brain `program` value. |
| Business & Career | `program=Business` | Existing Program filter (Mastermind + practice-building talks) |
| Herbalism | `program=Herbalism` | Existing Program filter (`herbal` in the export + title classify) |
| BCHN | `program=BCHN` | Existing Program filter (BCHN / NANP) |
| Mentorship / Community | `browse=community` | Community Live, roundtables, welcomes, mentorship overview. **Not** `program=Mentorship` — that catalog field is over-applied to Business Mastermind recordings. |
| Office Hours | `program=Office Hours` | New Graduate Roundtable (`NGR`) and titled Live Call sessions. The Brain export has no `office hours` program; classify infers it from titles. |

## Display titles

House style is `docs/TITLE-CONVENTION.md` (Sean, 2026-09-18). **Library display only** — this repo does not rename YouTube.

Overrides are keyed by **YouTube video id** (`Video.youtubeId` / Brain `video_id`), not the Prisma cuid in `/library/[id]` URLs.

- `data/brain/display-titles.batch-1.json` — official CoS batch 1 (133 videos: Mastermind / NGR→**New Graduate Roundtable** / Community Live date cleanups, plus a few teaching polish titles).
- `data/brain/display-titles.batch-2.json` — official CoS batch 2 (13 guest/teaching talks in `Topic — Speaker, Credential` form; optional `speaker` seeds `Video.speakers`).
- `data/brain/display-titles.batch-3.json` — official CoS batch 3 (3 topic-polish titles; no invented speakers).
- `data/brain/display-titles.batch-4.json` — official CoS batch 4 (6 early-transcript roster hits in `Topic — Speaker, Credential` form).
- `data/brain/display-titles.batch-5.json` — official CoS batch 5 (10 series/date cleanups).
- `data/brain/display-titles.batch-6.json` — official CoS batch 6 (15 Intro to Herbalism / guest-module titles).
- `data/brain/display-titles.batch-7.json` — official CoS batch 7 (101 short-orphan and topic-polish titles).
- `data/brain/display-titles.batch-8.json` — official CoS batch 8 (105 remaining titles, including Zoom `Recording —` dates). Later `batch-N` files win on conflict.
- `data/brain/display-titles.batch-9.json` — official CoS batch 9 (`VXGZZirK56I`: Grand Rounds — Sep 17, 2026).
- `data/brain/display-titles.batch-10.json` — official CoS batch 10 (`OjkzfeJz66o`: Cancer, Angiogenesis, and Nutrition — William Li). Together with batches 1–9 these cover all 386 catalog videos.
- `data/brain/display-titles.json` — extra teaching titles not in an official batch. Currently empty. Later `batch-N` files win on conflict.

To add **batch 11**: create `data/brain/display-titles.batch-11.json` in the same `{ items: [{ video_id, display_title, speaker? }] }` shape. `src/lib/display-title.ts` already loads every `display-titles.batch-*.json`. Preview with `npm run titles:preview` (miss count must be 0), then `npm run db:seed`. YouTube is not renamed from this repo; `docs/STUDIO-RENAME.csv` is the pending Studio list only.

Format: `Topic — Speaker, Credential` when the speaker is known; series without a guest use `Series — Mon D, YYYY` (em dash). Do not invent credentials.

Recurring Mastermind / NGR / Community Live / dated roundtables are inferred automatically in `src/lib/display-title.ts` when there is no JSON override. Preview without writing the database:

```bash
npm run titles:preview
```

Then re-import so SQLite/Postgres picks up the new titles: `npm run db:seed`.

### Data gaps

- Most catalog rows have **no speaker field**. Names are inferred from titles when obvious (Betsy Miller, Dr. Kim Ross, …). Many guest talks are first-name only (Danielle, Val, Jade, Julie T, Cara) with **no credential** — those titles use the name as-is.
- `Liz Lipski` still has no topic in the YouTube title, so the display title stays `Liz Lipski` rather than inventing one. Batch 2 lightly inferred `Performance & Physiology` for Dr. Mike T. Nelson.
- Zoom filenames (`GMT…`) display as `Recording — Mon D, YYYY`. The raw YouTube title stays on `Video.title`. One-word roadmap titles (`Fears`, `Vehicle`, and similar) stay short when the session topic is not confirmed.
- Brain `program` is often `mentorship` or `null`, so shelves are title/classify-based, not a clean Studio taxonomy.

`speakers`, `programs`, and `topics` are JSON arrays stored as strings so the same fields work on SQLite and Postgres.

`TranscriptSegment` — `videoId`, `startMs`, `endMs?`, `text` (Brain chunks are stored here; `start_sec` / `end_sec` from the export are converted to milliseconds).

Production uses `prisma/schema.postgres.prisma` whenever `DATABASE_URL` starts with `postgres`. `npm run build` generates the client, pushes the schema, and seeds the Brain catalog.

## Deploy notes (Netlify)

Live site: **Netlify** site `bespoke-elf-113889` → [holisticconsultinghq.com](https://holisticconsultinghq.com). Do **not** change DNS. Do **not** deploy this repo to the Old City Swim School Vercel team.

1. Production branch is `main`. `netlify.toml` runs `npm run build` (Next.js + `@netlify/plugin-nextjs`).
2. In Netlify → Site configuration → Environment variables, set `DATABASE_URL` to the Netlify/Postgres connection string when needed (`NETLIFY_DB_URL` is used automatically on this site).
3. Trigger a production deploy from `main`. Build seeds the Brain catalog from `data/brain/`.
4. Confirm `https://holisticconsultinghq.com/library` is 200 with no login. Homepage / nav / footer must not mention `/library`.
5. Confirm `POST /api/brain/ask` and `/library/ask` (noindex) return cited clips. Do not deploy this repo to Old City Vercel.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Generate Prisma client, push schema, start Next.js |
| `npm run db:setup` | Push schema and seed the Brain catalog |
| `npm run db:seed` | Replace the catalog from `data/brain/` |
| `npm run brain:import` | Same import; accepts `--videos` and `--chunks` |
| `npm run brain:embed` | Rebuild `data/brain/embeddings.json.gz` (MiniLM by default; OpenAI if `OPENAI_API_KEY` is set; `--provider tfidf` for the hasher fallback) |
| `npm run brain:ensure-minilm` | Download the quantized MiniLM files into `data/brain/models/` (also runs during `npm run build`) |
| `npm run brain:retrieve:verify` | Check synonym + paraphrase queries; prints TF-IDF vs neural ranks |
| `npm run brain:ask:verify` | Check cite-only Q&A (Betsy / SIBO / refuse) plus citation unit tests |
| `npm run titles:preview` | Print browse-shelf counts, batch match/miss counts, and sample display titles |
| `npm run ingest` | Pull the public YouTube channel when `YOUTUBE_API_KEY` is set |
| `npm run build` | Production build (generate, push, seed, ensure MiniLM, next build) |
