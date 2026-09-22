# Brand corpus (February 2026)

Reference documents for Holistic Consulting visual identity. Loaded for CoS and any future document ask. **Not** part of the member recording index.

| File | What it is |
| --- | --- |
| `BRAND.md` | Fleet one-pager. Read this first. |
| `web-identity.txt` | Web / primary brand extract (header, type, buttons, palette). |
| `print-collateral.txt` | Print and collateral extract. |
| `herbal-medicine.txt` | Herbal Medicine sub-brand. Use only on herbal surfaces. |
| `guides/*.html` | Canonical HTML guides. These win if a text extract disagrees. |

## Why this is not in `embeddings.json.gz`

Library search and Brain Q&A cite **recordings**. The vector index is `{ youtubeId, startMs, endMs }`. Mixing these files into that index would answer palette questions with fake lecture citations and would crowd real talks.

Do not add brand chunks to `search_chunks.json.gz` or `embeddings.json.gz`.

## How to use them

From the repo root:

```bash
# Confirm the corpus is present (no database write).
find data/brain/brand -type f | sort
```

A document retrieve step, when one exists, should read this folder as its own source and keep recording citations on the video index.
