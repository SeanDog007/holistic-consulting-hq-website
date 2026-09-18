# Holistic Brain bot v1 (brief)

**Status:** Draft for build after display-title batch 2  
**Owner:** CoS routes; specialist bot later  
**Standing go:** Sean 2026-09-18 — ship Brain/library follow-through without per-step approval

## Problem
`/library` keyword search + `&t=` works. Members (and CoS) still can’t ask a question and get **cited clips**.

## v1 outcome
Internal-first chat (CoS-accessible): question → 2–4 transcript hits with title, speaker, timestamp deep link (YouTube `&t=` and `/library` watch `?t=`).

## Stack (proposed)
1. **Corpus:** existing catalog segments (~348k) + display titles + speaker fields as they land  
2. **Embeddings:** chunk ~45–90s overlapping windows; store vector + `video_id`, `start_sec`, `end_sec`, text  
3. **Retrieve:** hybrid keyword (current) + semantic top-k; rerank by diversity (max 2 hits/video)  
4. **Answer:** short synthesis + citations only (no unsourced clinical advice)  
5. **Hosting:** stay on Netlify/library stack or small worker; do **not** put Brain on Old City Vercel

## Non-goals (v1)
- Public member chatbot on marketing site  
- Circle chat / Drive dump as corpus  
- Auto clinical protocols without citations

## Build order
1. Speaker fields + guest titles (batch 2+)  
2. Embedding pipeline over ASR segments  
3. Internal query API + CoS tool  
4. Specialist Brain bot when volume justifies

## Success
- “What has Betsy said about herbal safety?” → correct clips with timestamps  
- “SIBO” / paraphrase queries beat pure keyword  
- Zero answers without a citation
