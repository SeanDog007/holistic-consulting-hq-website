# Holistic Consulting HQ — system map and working rules

Read this before changing anything. The rules exist because each one has
already been broken once.

---

## 1. The map: repo → Netlify site → domain

| Domain | Netlify site | GitHub repo | What it is |
|---|---|---|---|
| **holisticconsultinghq.com** | `cozy-granita-08ee74` | `holistic-consulting-hq` | The marketing site. 16 static HTML pages. |
| library.holisticconsultinghq.com | `bespoke-elf-113889` | `holistic-consulting-hq-website` | Next.js recording library + Brain Q&A. **Library only.** |
| crm.holisticconsultinghq.com | `holistic-consulting-crm` | `holistic-consulting-crm` | CRM + the Netlify Functions every site's forms post to |
| prep.holisticconsultinghq.com | `holistic-consulting-exam-prep` | `holistic-consulting-exam-prep` | BCHN exam prep tool |
| herbs.holisticconsultinghq.com | `friendly-crostata-a342ad` | `holistic-consulting-herbs` | Herbalism site |
| journal.holisticconsultinghq.com | `holistic-journal` | `holistic-consulting-journal` | Journal / articles |
| business.holisticconsultinghq.com | `holistic-consulting-business` | `holistic-consulting-business` | Business site |
| materiamedica.holisticconsultinghq.com | `tubular-yeot-b285c2` | `materia-medica` | Materia Medica |
| casestudy.holisticconsultinghq.com | `prism-case-study-writer` | `prism-case-study-writer` | Case study writer |

Local clones live at `~/Desktop/HCQ/HCQ-Repos/`. There is exactly one clone of
each repo — keep it that way (see §6).

DNS is on Netlify (NS1 nameservers). Adding a custom domain to a site creates
the record automatically; no external DNS step.

---

## 2. The incident this document exists to prevent

**2026-09-12.** An agent building the recording library in
`holistic-consulting-hq-website` needed it reachable at a real URL. It moved
`holisticconsultinghq.com` and `www` **off** `cozy-granita-08ee74` and **onto**
`bespoke-elf-113889`.

That repo also contained a stale copy of the marketing site in `public/`,
frozen before the July 2026 restructure. So for nine days the public website:

- showed the retired **LAUNCH / GROW / MASTER** program framework
- showed **`[Price TBD]`** instead of real pricing
- **404'd** on `/mentorship` and `/apply`
- served an outdated About page

Nothing in `holistic-consulting-hq` was damaged. It simply had no domain
pointed at it. Fixed 2026-09-21: the library moved to its own subdomain and the
apex went back to `cozy-granita-08ee74`.

**The lesson:** if a new thing needs a URL, give it a **subdomain**. Never move
the apex.

---

## 3. Hard rules

1. **Never reassign `holisticconsultinghq.com` or `www`.** They belong to
   `cozy-granita-08ee74`. Anything new gets its own subdomain.
2. **`holistic-consulting-hq-website` serves the library only.** It must never
   serve marketing pages. Marketing paths there redirect to the real site by
   design — do not "restore" them. Do not re-add `public/*.html`.
3. **Marketing copy changes go in `holistic-consulting-hq`**, never in a copy.
4. **Deploy = push to `main`.** There is no staging. A merge is a publish.
5. **`main` is branch-protected** on `holistic-consulting-hq` and
   `holistic-consulting-crm`: PR + 1 approving review. Branch as
   `<name>/<short-description>`, open a PR, check the Netlify deploy preview,
   then merge. GitHub won't let you approve your own PR — the repo owner merges
   with the admin bypass.
6. **Don't change the palette, fonts, nav structure, or pricing** without
   Sean's explicit go-ahead.
7. **Don't touch credentials.** Service-role keys and API tokens live in local
   `.env` files and the Netlify dashboard. Never commit them, never print them.

---

## 4. The marketing site (`holistic-consulting-hq`)

- 16 standalone HTML pages at the repo root. **No build step, no framework.**
  Each page carries its own `<style>` block and its own copy of the CSS
  custom properties.
- Only `apply.html` and `enroll.html` use Tailwind (CDN). The other 14 are
  hand-written CSS. **Match the page you're in** — don't introduce Tailwind
  into a hand-written page.
- `npm install` once, for the screenshot script. Then:
  `PORT=3100 node serve.mjs` and
  `node screenshot.mjs http://localhost:3100/<page>.html <label>`
  (3000 is usually taken; screenshots land in `temporary screenshots/`).
- Brand tokens — use these, never hardcode a duplicate hex or invent a color:
  `--emerald #2E7D32` · `--emerald-lt #4CAF50` · `--gold #C9963B` ·
  `--gold-lt #D4A84B` · `--charcoal #2D3436` · `--slate #636E72` ·
  `--sage #E8F5E9` · `--warm-gray #F5F0EB` · `--off-white #FAFAFA` ·
  `--border #DFE6E9`
  Fonts: **Cormorant Garamond** (display) + **DM Sans** (body). Never swap roles.
- Responsive breakpoints in use: **960px** and **640px**. Check both. Wide
  content must not cause horizontal page scroll.
- Sections animate via `.fade-up` + IntersectionObserver. In a headless
  browser these report `opacity: 0` — that is the observer not firing, **not**
  a bug you introduced.
- Netlify serves pretty URLs (`apply.html` → `/apply`) and rewrites attribute
  quotes in post-processing, so deployed HTML won't match naive greps against
  source. Verify against the source file.
- Permanent redirects go in `_redirects`, one per line, with a comment saying
  why and when.

**Current program structure (since July 2026):** Courses / Mentorship / 1:1.
**LAUNCH, GROW and MASTER are retired** — do not reintroduce them. The
Mentorship Program runs on **quarterly cohorts**, is **by application**
(`/apply`), and lists no price on the page.

---

## 5. Forms and the CRM (read before touching any form)

**Every form on every site** POSTs to one shared endpoint:

```
https://holistic-consulting-crm.netlify.app/.netlify/functions/submit-lead
```

It writes the lead to Supabase, syncs to Kit (email), and fires team alerts.
Changing a form's `sourceForm` or `interest` value without a matching change in
`holistic-consulting-crm` will **silently misroute or drop real leads**. This
has happened: three journal lead-magnet forms 400'd on every submission for
months because their `sourceForm` wasn't registered, and zero leads were
recorded. Ask before editing form JS.

Known gotchas in that function, already fixed — don't reintroduce the pattern:
- An email can legitimately have several `leads` rows (`idx_leads_email_active`
  is a **partial** unique index covering only non-archived leads). Use
  `.limit(1)` ordered active-row-first — **never `.maybeSingle()`**, which
  errors on more than one row.
- Never discard the `error` half of a Supabase destructure. Swallowing one is
  what turned a lookup failure into a 500 on every form submission.

---

## 6. Working practices that have burned us

- **One clone per repo.** A second clone at `~/Projects/HCQ-Repos/` drifted 14
  commits behind and accumulated work that existed nowhere else — three
  uncommitted Kit funnel documents and an unpushed 4-commit feature branch.
  Before deleting any working copy, check for untracked files, stashes, and
  local branches not on a remote.
- **Read `CLAUDE.md` / this file before trusting repo instructions.** The
  marketing repo's `CLAUDE.md` was stale for months — it described a different
  project, named an uninstalled skill, and pointed at Windows paths on a Mac.
  If repo instructions contradict what you observe, trust what you observe and
  say so.
- **Verify against the live site, not assumptions.** Netlify post-processing,
  pretty URLs, and deploy lag all make the deployed HTML differ from source.
- **Check a deploy preview before merging** anything with a real build step.
  The library build seeds Prisma and fetches a MiniLM model; a failure there
  takes the library down.

---

## 7. State as of 2026-09-21

Working and verified:
- Apex + `www` → `cozy-granita-08ee74`; all 16 marketing pages resolve
- `library.holisticconsultinghq.com` → library; `/` goes to `/library`; every
  marketing path redirects to the real site; `public/*.html` deleted
- Branch protection on `holistic-consulting-hq` and `holistic-consulting-crm`

Open:
- **`holistic-consulting-hq-website` `main` is NOT branch-protected.** Worth
  adding, given this is the repo the incident came from.
- `holistic-consulting-hq` PR #20 — rescued Kit herbal-funnel docs, unmerged
- Branch `david/hc-membership-reorientation` parked on origin — a Membership
  landing page superseded by the July restructure. Don't merge without asking.
- `/faq` and `/blog` don't exist on the marketing site. Redirects point at
  `/programs` and the journal subdomain respectively.
