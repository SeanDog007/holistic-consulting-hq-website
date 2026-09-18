# Holistic Brain bot v1

**Status:** Retrieval shipped (semantic + cited clips). Cite-only Q&A shipped — see `docs/BRAIN-QA-V1.md`.  
**Owner:** CoS routes; specialist bot later  
**Standing go:** Sean 2026-09-18 — ship Brain/library follow-through without per-step approval  
**Host:** Netlify / holisticconsultinghq.com — do **not** put Brain on Old City Vercel

## What shipped

`/library` hybrid search: existing keyword `contains` **union** sentence-embedding retrieve. Results are **cited clips** with `/library/{id}?t=` and YouTube `&t=` deep links. Max **2 hits per video**.

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
| Provider (default) | `local-minilm-l6-v2` — Xenova `all-MiniLM-L6-v2` (384-d int8), $0, no API key |
| Optional API | `openai-text-embedding-3-small-v1` (512-d) when `OPENAI_API_KEY` is set at `npm run brain:embed` **and** on Netlify for the query vector. ~$0.02 / 1M tokens (~$0.08 to re-embed this catalog; query cost is negligible). |
| Fallback | Seed: `local-hash-tfidf-v1` if MiniLM/OpenAI cannot bake the index. Query: keyword-only if the neural encoder fails to load (`semanticError` on `/api/library/search`). Prod does not 500. |
| Store | Committed file `data/brain/embeddings.json.gz` (loaded in-process on Netlify) |
| Model files | Downloaded to `data/brain/models/` (gitignored) by `npm run brain:ensure-minilm` / Netlify `npm run build` |

Corpus vectors are baked. Runtime only encodes the query (one MiniLM forward pass, or one OpenAI embeddings call). No pgvector. Same file locally and in prod.

Env (optional, never required for a green prod deploy):

| Variable | Role |
| --- | --- |
| `BRAIN_EMBED_PROVIDER` | `auto` (default) / `minilm` / `openai` / `tfidf` |
| `OPENAI_API_KEY` | Only if you choose OpenAI. Do not invent a key. |
| `OPENAI_EMBEDDING_MODEL` | Default `text-embedding-3-small` |
| `OPENAI_EMBEDDING_DIM` | Default `512` |

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

Query: `a fungal overgrowth in the gut that thrives when bacteria are wiped out` (no “candida” / “yeast”)

- TF-IDF ranks unrelated Mastermind / guest talks. MiniLM cites **Candida Overgrowth** (`GS5ocaPI2pA`).

Query: `aged cheese wine and leftovers triggering itching and flushing` (no “histamine”)

- TF-IDF misses the histamine lectures. MiniLM cites **Histamine Intolerance** (`xIbvG2brGXA`) and the NGR histamine recap (`faq8U0Rt6fw`).

Query: `What has Betsy said about herbal safety?`

- Expected cited video: **Herbal Medicine for the Nutrition Professional — Betsy Miller** (`mowBWYHvJwg`) — botanical safety / herb–drug clip (~38:00). The dedicated safety lecture `JU8zEO73Lus` has no ASR in the current export.

Run `npm run brain:retrieve:verify` (prints TF-IDF vs neural ranks for the paraphrase-gap cases).

## Chat layer

Shipped on Netlify only (`docs/BRAIN-QA-V1.md`):

1. `POST /api/brain/ask` `{ question }` — hybrid retrieve, ≤2 hits/video, 2–4 citations
2. Short synthesis **only** from returned citations (template if no LLM key; refuse if no decent hits)
3. Unlisted noindex UI: `/library/ask`

Specialist Brain bot when volume justifies. Non-goals remain: public member chatbot on marketing pages, Circle/Drive corpus, auto protocols without citations.
