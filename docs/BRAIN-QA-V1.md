# Holistic Brain Q&A v1 (CoS-facing)

**Status:** Shipped (cite-only ask layer)  
**Standing go:** Sean 2026-09-18 — keep rolling  
**Host:** Netlify / holisticconsultinghq.com — do **not** put Brain on Old City Vercel

## Outcome

CoS (and later a specialist bot) can ask a natural question and get:

- 2–4 **cited** transcript clips (title, optional speaker, `?t=` + YouTube `&t=`)
- A short synthesis that **only** restates what’s in those clips
- Explicit “not clinical advice / cite-only” guardrail

## Shape

1. `POST /api/brain/ask` with `{ question: string }`
2. Retrieve via the live hybrid `/api/library/search` path (`searchLibrary`) → diversify ≤2/video
3. Return 2–4 citations; refuse if nothing is confident enough
4. LLM answer with forced `[1]` / `[2]` markers when `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` is set; otherwise a template summary of the same excerpts
5. Log `question → citations` (no PII) as `event: "brain_ask"`

Unlisted try page: `https://holisticconsultinghq.com/library/ask` (noindex).

```bash
curl -sS -X POST https://holisticconsultinghq.com/api/brain/ask \
  -H 'content-type: application/json' \
  -d '{"question":"What has Betsy said about herbal safety?"}'
```

Better vectors help automatically: ask does not re-implement retrieve. When the embedding provider upgrades, `searchLibrary` rankings improve and this endpoint inherits them.

## Guardrails

- No unsourced advice. Synthesis may only use retrieved clip text.
- Empty / low-confidence → `I couldn't find that in the library.`
- Missing LLM key does **not** block ship — citations + template summary still return.
- Not a public marketing chatbot. Homepage / nav / footer stay clean.

## Success

- “What has Betsy said about herbal safety?” → her talk + timestamps
- Paraphrase questions work once real embeddings ship (local-hash-tfidf already handles several expansions)

## Verify

```bash
npm run brain:ask:verify
```

## Non-goals

- Public member chatbot on the marketing site
- Uncited protocols
- Replacing `/library` browse chips or breaking search
