# Holistic Brain bot v1

**Status:** Retrieval shipped (semantic + cited clips). Cite-only Q&A shipped — see `docs/BRAIN-QA-V1.md`.  
**Owner:** CoS routes; specialist bot later  
**Standing go:** Sean 2026-09-18 — ship Brain/library follow-through without per-step approval  
**Host:** Netlify / holisticconsultinghq.com — do **not** put Brain on Old City Vercel

## What shipped

`/library` hybrid search: existing keyword `contains` **union** hashed-embedding retrieve. Results are **cited clips** with `/library/{id}?t=` and YouTube `&t=` deep links. Max **2 hits per video**.

Internal retrieve API (citations only, no unsourced answer):

```
GET /api/library/search?q=What+has+Betsy+said+about+herbal+safety
```

No public marketing chatbot. Do not invent clinical advice — show the clip or say nothing.

## Corpus

- `data/brain/search_chunks.json.gz` — Studio ASR already windowed at ~45s / ~800 characters
- Existing ~45s chunks are the embed windows (Brain export already chunked; no second windowing pass)
- Display titles + speakers are prepended to each window so “Betsy / herbal safety” can match title context
- `JU8zEO73Lus` (Herbal Safety for Nutrition Practice — Betsy) has `missing_transcript` in the export, so retrieve cites Betsy talks that have ASR (`mowBWYHvJwg`) plus Principles of Herbal Safety

## Embeddings (this repo)

| | |
| --- | --- |
| Provider | `local-hash-tfidf-v1` — signed feature-hashed TF-IDF (256-d int8) + paraphrase expansion |
| Paid API | **None. $0.** No OpenAI key. No pgvector. Fits SQLite local + Netlify Postgres without a schema split. |
| Store | Committed file `data/brain/embeddings.json.gz` (loaded in-process on Netlify) |
| Why not pgvector / OpenAI | Dual SQLite/Postgres already; Netlify functions need a store that works without an extra extension or runtime key. File index is the same locally and in prod. |

Query-time encode uses the same hasher + IDF map. Cold start is a gzip parse, not a model download.

## Re-embed (new videos / weekday Brain sync)

After replacing the Studio export:

```bash
# 1. drop new data/brain/videos.json + search_chunks.json.gz
npm run brain:embed          # rebuild data/brain/embeddings.json.gz
npm run brain:retrieve:verify
npm run brain:import         # or npm run db:seed — catalog rows
# 2. commit export + embeddings.json.gz
# 3. merge to main → Netlify production build re-seeds Postgres
```

Tie `npm run brain:embed` into the weekday Brain sync **after** the chunk export lands and **before** or with `brain:import`. Production does not re-embed at build time; it ships the committed index.

Optional paths: `npm run brain:embed -- --videos … --chunks … --out …`

## Example (paraphrase)

Query: `gut bacteria overgrowth in the small bowel`

- Cited talks include **Small Intestinal Bacteria Overgrowth** (`tkINS6S4FDs`) and **SIBO Masterclass** (`9n9oLpV3uag`)
- Deep link shape: `/library/{prismaId}?t={startSec}` and `https://www.youtube.com/watch?v=9n9oLpV3uag&t={startSec}s`

Query: `What has Betsy said about herbal safety?`

- Expected cited video: **Herbal Medicine for the Nutrition Professional — Betsy Miller** (`mowBWYHvJwg`) — botanical safety / herb–drug clip (~38:00). The dedicated safety lecture `JU8zEO73Lus` has no ASR in the current export.

Run `npm run brain:retrieve:verify` to re-check both (plus Principles of Herbal Safety).

## Chat layer

Shipped on Netlify only (`docs/BRAIN-QA-V1.md`):

1. `POST /api/brain/ask` `{ question }` — hybrid retrieve, ≤2 hits/video, 2–4 citations
2. Short synthesis **only** from returned citations (template if no LLM key; refuse if no decent hits)
3. Unlisted noindex UI: `/library/ask`

Specialist Brain bot when volume justifies. Non-goals remain: public member chatbot on marketing pages, Circle/Drive corpus, auto protocols without citations.
