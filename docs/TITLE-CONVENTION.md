# Holistic recording title convention

**Status:** Adopted 2026-09-18 (Sean)  
**Applies to:** YouTube titles (source of truth long-term) and `/library` display titles (can lead).

## Templates

### Guest / teaching talk (preferred)
```
{Clear topic} — {Speaker}, {Credential}
```
Example: `Herbal Safety for Nutrition Practice — Betsy Miller, Registered Herbalist`

Rules:
- Em dash `—` (not hyphen `-`, not en dash alone without spaces mishmash).
- Topic first, concrete, scannable at 160px/list density.
- Credential only when real (RH, RDN, CNS, ND, etc.). Never invent.
- No ISO timestamps, no `T15:01:22Z`, no `09152026` smashed dates.

### Recurring series (no guest topic)
```
{Series} — {Mon D, YYYY}
```
Examples:
- `Business Mastermind — Sep 8, 2026`
- `New Graduate Roundtable — Aug 27, 2026` (expand `NGR`)
- `Community Live — Sep 15, 2026`

When a topic is known for that session, insert it:
```
{Series}: {Topic} — {Mon D, YYYY}
```

### Welcome / ops / shorts
Keep short and intentional; still avoid date codes.
- `Welcome to Holistic Consulting`
- Prefer a real topic over one-word orphans (`Fears` → expand once context is known).

## Library vs YouTube

1. **`/library` display title** can be curated immediately (`displayTitle` / override map).
2. **YouTube rename** follows in batches after display titles are approved — same string when possible.
3. Brain catalog keeps `title` from YouTube; library prefers `displayTitle` when set.

Official CoS batches live in `data/brain/display-titles.batch-N.json` (batch 1 = series dates; batch 2 = guest/teaching talks). Later batches win. To add batch 3, drop another file in that folder — see `data/brain/README.md`.

## Browse shelves (library UI)

Chips above search (not a replacement for search):
| Chip | Intent |
|------|--------|
| Clinical Practice | Clinical nutrition / testing / conditions / practice skills |
| Business & Career | Business, career, NANP, practice building |
| Herbalism | Herbal safety & materia |
| BCHN | Board / exam pathway |
| Mentorship / Community | Cohort lives, community lives, mentorship |
| Office Hours | OH / office hours |

Exact filter mapping lives in the website PR.

## Anti-patterns
- `Business Mastermind Call: 2026-09-08T15:01:22Z`
- `NGR 8_20_2026` / `Community Live 09152026`
- One-word titles with no context
- Logo/speaker stuffing in the title string
- Fabricated credentials
