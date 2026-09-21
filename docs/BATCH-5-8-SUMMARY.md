# Display titles batches 5–8

**Shipped:** 2026-09-21  
**Convention:** `docs/TITLE-CONVENTION.md`

Library display only. `data/brain/videos.json` still stores the original YouTube title in `title`. Seed writes the curated string to `Video.displayTitle`. YouTube Studio is not renamed by this repo.

## Coverage

| | Count |
|---|---|
| Catalog videos | 384 |
| Batch 5 (date/series cleanups) | 10 |
| Batch 6 (Intro to Herbalism / guest-module) | 15 |
| Batch 7 (short orphans + topic polish) | 101 |
| Batch 8 (Zoom, roundtables, GI, rest) | 105 |
| Unique override map, batches 1–8 | 384 |
| Uncovered | 0 |
| Pending YouTube Studio renames (`docs/STUDIO-RENAME.csv`) | 260 |

`docs/STUDIO-RENAME.csv` is a reference list of rows where the YouTube title still differs from the display title. It is not applied on YouTube.

## Files

- `data/brain/display-titles.batch-5.json`
- `data/brain/display-titles.batch-6.json`
- `data/brain/display-titles.batch-7.json`
- `data/brain/display-titles.batch-8.json`

Later batches win over earlier ones and over `data/brain/display-titles.json` (now empty; batches 1–8 covered the 384-video catalog).

Batch 9 adds `VXGZZirK56I` (YouTube `Grand Rounds 09172026` → library **Grand Rounds — Sep 17, 2026**). Batch 10 adds `OjkzfeJz66o` (YouTube `Can we eat to starve cancer? - William Li` → library **Cancer, Angiogenesis, and Nutrition — William Li**). The catalog is 386 videos, each with a display title. The Studio rename list is 260 pending rows.

## Before → after

| video_id | YouTube `title` | Library display |
|---|---|---|
| `SeQQkvqS1q8` | 7_1_}2026 NGR_MidYear Goals | New Graduate Roundtable: Mid-Year Goals — Jul 1, 2026 |
| `HkOlHqzTS_4` | GMT20260429 233158 Recording 1920x1080 | Recording — Apr 29, 2026 |
| `kkJU32Aens0` | Masering Immune Balance Part 1 | Mastering Immune Balance Part 1 |
| `VLjxq5FpnAc` | Redfining IBS | Redefining IBS |
| `4evhQ9yps-A` | Intro to Herbalism - Digestion | Intro to Herbalism: Digestion |
| `JS3s2u1kMxM` | 10 29 2025 Member Roundtable | Member Roundtable — Oct 29, 2025 |
| `3xrdFKJve78` | AI in Nutrition NGR 5 13 26 | New Graduate Roundtable: AI in Nutrition — May 13, 2026 |
| `fwZz9ZHX-Dk` | Journal Roundtable 8 20 2025 | Journal Roundtable — Aug 20, 2025 |
| `Bzy8G9BAqpg` | GI Digestive Health Pt 1a | GI Digestive Health, Part 1a |
| `WmxHXioxJsI` | Community Live 09152026 | Community Live — Sep 15, 2026 |

## Conservative keeps

- **Liz Lipski (`IhK7A3AHo9A`):** speaker-only title; no topic invented.
- **Mental Health Part 2/3:** no roster speaker added.
- **Fears / Vehicle / Roadblock / Opportunities / Aspirations:** left short.
- **Recording — Apr 29, 2026 (`HkOlHqzTS_4`):** Zoom filename cleaned to a date. Series and speaker were not guessed.
