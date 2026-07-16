<div align="center">

# GraveSigns

### Death Chart Readings — a practice within the Truestherb platform

Compassionate, astrologer-grade readings of the sky at the moment a soul
crosses — for people and beloved pets alike.

</div>

---

GraveSigns casts a **true death chart** for the moment of passing (real
planetary positions, aspects, houses, and lunar phase from a high-precision
ephemeris) and composes a sophisticated, tender reading with **Claude** —
written in the voice of a practitioner who has spent 20+ years with charts of
transition.

## ✦ Tech stack

- **Next.js 15** (App Router) + **TypeScript**
- **Tailwind CSS** + **shadcn/ui**-style components
- **Supabase** (Postgres) for storing readings
- **Anthropic Claude** for reading generation — five passes, each on a model you
  choose (defaults to `claude-opus-4-8` everywhere; per-pass overridable)
- **Swiss Ephemeris** via **sweph-wasm** — the astrologer's gold-standard ephemeris (full DE431 `.se1` data files), compiled to WebAssembly, no native deps
- Proper **time-zone resolution** (`tz-lookup` + `luxon`) with DST/historical rules
- Premium form UX: a **searchable time-zone combobox** with live GMT-offset badges and a **place autocomplete** that pins exact coordinates
- **Vercel**-ready

## ✦ How it works

```
Form (name, date, optional time/place, optional birth details, human|pet, notes)
        │
        ▼
POST /api/readings
   1. Geocode place(s) (keyless Open-Meteo) when a time is also given
   2. computeDeathChart()      ──►  real positions, houses, aspects, Moon phase,
                                    sect, cusps, speeds  (Swiss Ephemeris DE431)
   3. [optional] natal chart from birth details
   4. runReadingPipeline():
        Step 0  computeChartAnalysis()  — deterministic: dignities, Arabic lots,
                aspect patterns, chart shape, fixed stars, the 8th/4th/12th
                complex, mortal significators; + lifespan & cross-aspects if natal
        Pass A  Judgment      — Claude distils a weighted, sourced dossier (JSON)
        Pass B  Composition   — Claude composes the reading (born aligned to a
                                short ethical covenant, and deepened by the
                                interpretive delineations retrieved for the
                                factors present in this chart)
        Pass E  Ethical Alignment — Claude audits the prose against the loaded
                                Code(s) of Ethics; one revision if misaligned
        Pass C  Verification  — Claude audits it; one revision if it fails
        Pass N  Study Notes   — Claude keeps the practitioner's working notebook
                                on the chart (craft, research threads, limits)
   5. saveReading()            ──►  Supabase (no-op in demo mode)
        │
        ▼
Interactive chart wheel + tables + the composed reading + the astrologer's casebook
```

Only a **name** and **date of death** are required. Supplying a **time** and
**place** together unlocks the Ascendant, Midheaven, and house placements.
Supplying **birth details** casts the nativity too and adds the traditional
length-of-life reading, the death-moment cross-aspects, and a bi-wheel.

## ✦ Project structure

```
src/
├── app/
│   ├── layout.tsx                 # shell, fonts, header/footer
│   ├── page.tsx                   # landing hero + reading form
│   ├── globals.css                # dark/luxury theme tokens
│   ├── readings/
│   │   ├── page.tsx               # "Previous Readings" gallery (demo mode)
│   │   └── [id]/page.tsx          # a single saved reading
│   └── api/readings/
│       ├── route.ts               # POST (create) + GET (list)
│       └── [id]/route.ts          # GET one reading
├── components/
│   ├── reading-form.tsx           # the interactive form (client)
│   ├── reading-display.tsx        # chart panel + reading + casebook
│   ├── chart/                     # the visual layer
│   │   ├── chart-panel.tsx        # tabbed orchestrator (client)
│   │   ├── chart-wheel.tsx        # SVG wheel + bi-wheel
│   │   ├── dignities-table.tsx / aspectarian.tsx / mortality-panel.tsx
│   │   ├── moon-phase.tsx / dossier-notes.tsx / study-notes.tsx
│   ├── logo.tsx / starfield.tsx / site-header.tsx
│   └── ui/                        # button, input, textarea, label, card
└── lib/
    ├── astrology.ts               # ephemeris → DeathChart
    ├── pipeline.ts                # the reading pipeline (judgment→compose→ethics→verify→notes)
    ├── analysis/                  # Step-0 deterministic engine
    │   ├── reference.ts           # source-verified traditional tables
    │   ├── dignities.ts / lots.ts / patterns.ts / fixedstars.ts
    │   ├── deathfactors.ts        # 8th/4th/12th complex, significators
    │   ├── lifespan.ts / synastry.ts   # natal (Tier-2) doctrine
    │   ├── serialize.ts           # analysis → evidence brief
    │   └── index.ts               # computeChartAnalysis()
    ├── knowledge/                 # the reference corpus (ethics + delineations)
    │   ├── index.ts               # loadKnowledge() + selectDelineations() — Supabase w/ bundled fallback
    │   ├── knowledge.test.ts        # vitest suite over the retrieval/corpus engine
    │   └── documents/
    │       ├── ncgr-code-of-ethics.ts   # bundled, verbatim NCGR code
    │       ├── death-delineations.ts    # factor-keyed interpretive corpus (Moon-by-sign, significators, …)
    │       ├── classical-sources.ts     # legal-path bibliography (public-domain vs. doctrine-only)
    │       └── classical-passages.ts    # verbatim public-domain excerpts (Ptolemy, Ashmand 1822)
    ├── glyphs.ts                  # shared glyphs + element palette
    ├── supabase.ts                # persistence (graceful demo fallback)
    ├── markdown.ts                # tiny, safe MD → HTML
    └── types.ts
supabase/schema.sql               # readings + knowledge_documents tables + RLS
supabase/seed/knowledge_documents.sql  # seeds the corpus (NCGR code of ethics)
.env.example                      # environment variables
```

## ✦ Run locally

```bash
# 1. Install
npm install

# 2. Configure environment
cp .env.example .env.local
#   → set ANTHROPIC_API_KEY (required)
#   → optionally set the Supabase keys to enable saving

# 3. Dev server
npm run dev
# open http://localhost:3000
```

> **Demo mode:** without Supabase, everything works end-to-end — readings are
> calculated and composed — they just aren't stored, and the "Previous
> Readings" gallery shows a connect prompt.

## ✦ Set up Supabase (optional)

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run [`supabase/schema.sql`](supabase/schema.sql).
3. Run [`supabase/seed/knowledge_documents.sql`](supabase/seed/knowledge_documents.sql)
   to seed the knowledge corpus (the NCGR Code of Ethics). Optional — the app
   ships with a bundled copy and falls back to it, but seeding makes the code
   editable in the database without a redeploy.
4. From **Project Settings → API**, copy into `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only — never expose to the browser)

The API routes write with the service-role key, so inserts succeed with RLS on.
A public **read** policy is included so the gallery renders; tighten it for
production.

### The knowledge corpus & the ethical-alignment pass

`knowledge_documents` is a general, versioned store of the practice's compiled
reference material — the Code of Ethics is its first `kind`; later kinds
(association standards, articles, webinar transcripts, published readings, case
data) are added as **rows**, with no schema or code change. The reading engine
reads it through one seam, [`src/lib/knowledge`](src/lib/knowledge), which loads
active documents from Supabase and **falls back to the bundled copies** when the
DB is unconfigured, empty, or lagging the schema — so a reading is never blocked.

The reading pipeline consults it twice: a short **operating summary** of the
code is folded into the composition pass so drafts are born aligned, and a
dedicated **Pass E — Ethical Alignment** then audits the finished prose against
the full code and revises it once if it is materially misaligned. Its verdict
(which clauses were engaged, what was adjusted) is persisted on the reading as
`ethics_review`. To retune what the engine aligns against, edit the
`knowledge_documents` row (no deploy) or the bundled file — the text is loaded
as data, never hardcoded into a prompt.

### The delineation corpus & retrieval

The corpus's second kind, **`delineation`**, is the practice's compiled
*interpretive* reference — short, source-grounded readings of each chart factor
(the Moon by sign, the lunar phase, the sect, the elemental cast, the chart
shape, the mortal significators, the 8th/4th/12th complex, the Lots, and the
death-salient fixed stars). It answers a different need than the astronomy: the
deterministic engine tells the composer **what** is in the sky, and the
delineation corpus tells it **what the tradition makes of it** — the doctrine a
practitioner carries from years with the texts. Without it, each factor got a
single thin sentence; with it, the composer has real depth to draw on.

Retrieval is **targeted, not a dump.** Each entry carries a `key`
(`moon:Scorpio`, `phase:Full Moon`, `significator:Saturn`, `house:8`,
`lot:Lot of Death`, `star:Algol`, …). `selectDelineations(chart, analysis)`
derives the keys **actually present** in a given chart from the same
deterministic analysis the visuals use, matches them against the corpus, ranks
so the interpretive spine (Moon, phase, significators, the death houses) leads,
caps the set, and folds only those entries into the composition pass. So a
water-sign, full-Moon, Saturn-weighted crossing pulls exactly the delineations
that bear on it and nothing else.

Every bundled entry is written **originally** for GraveSigns; where it cites a
source it points to the **public-domain** tradition (Ptolemy, Valens, Dorotheus,
Firmicus, Lilly) as a study trail — no copyrighted modern text is reproduced. It
ships bundled (so it works in demo mode with no database) and, like the ethics
code, can be **overridden or extended from Supabase** by adding
`knowledge_documents` rows of kind `delineation` whose `metadata.entries` array
holds more `{key, family, title, body, source}` entries — no code change. That
is also the seam through which larger sources (public-domain classical texts,
association standards) would be ingested and stored.

The corpus covers, by family: the Moon and Sun by sign, the lunar phase, the
sect, the elemental and modal cast, the chart shape, the mortal significators and
the karmic axis, **planetary condition (dignity)**, **hard malefic contacts**,
the 8th/4th/12th complex, the Lots, and the death-salient fixed stars — ~78
entries. The retrieval derives dignity and hard-contact keys only for the
luminaries and mortal significators, so those layers stay meaningful rather than
noisy.

### Legal-path sourcing policy

The corpus is grown on the **legal path only**: original writing plus
**public-domain** primary sources — no commercially licensed modern text is
stored. A third corpus kind, **`classical_source`**
([`classical-sources.ts`](src/lib/knowledge/documents/classical-sources.ts)), is
a vetted bibliography that records exactly which works may be ingested verbatim
(e.g. Ptolemy's _Tetrabiblos_ in Ashmand's 1822 translation, Lilly's 1647
_Christian Astrology_, Alan Leo, Sepharial) versus which are **doctrine-only** —
ancient texts whose sole modern English translations remain under copyright
(Valens, Dorotheus, Firmicus, Bonatti), to be cited as study references but never
copied. It carries a per-work rights note and an ingestion policy for the future
full-text corpus. (Rights hygiene, not legal advice — confirm any edition before
storing it.)

The first such ingest is already in the app: **`classical-passages.ts`** holds
**verbatim public-domain excerpts** from Ptolemy's _Tetrabiblos_ (Ashmand's 1822
translation), retrieved by the same factor keys as the delineations and folded
into composition as a secondary **PRIMARY SOURCES** reference — the tradition in
its own words alongside the practice's original delineations. Only
**temperament / nature** passages are ingested (Book I — the benefic/maleficent
bodies, the sect); the _Tetrabiblos_' duration- and kind-of-death chapters are
**deliberately excluded**, because GraveSigns never reads for a cause or a manner
of death and the composer must never be handed material that pushes toward one.
A test asserts no ingested passage contains cause-/manner-of-death content, and
the composer is instructed to echo the passages only sparingly and never import a
claim of cause or manner from them.

### Tests

The deterministic reading-depth engine — corpus integrity and the whole
retrieval seam — is covered by a **vitest** suite
([`src/lib/knowledge/knowledge.test.ts`](src/lib/knowledge/knowledge.test.ts)):

```bash
npm test          # run once
npm run test:watch
```

It verifies well-formed, unique, correctly-familied corpus entries; that every
retrieval-emittable family is covered; that `activeFactorKeys` derives the right
keys (and none when a chart lacks that testimony); that selection is
active-only, de-duplicated, spine-first ranked, and capped; that the classical
passages are well-formed and carry no cause-/manner-of-death content; and that
everything loads through the bundled fallback. This is how the depth work is
proven correct without a live model run.

## ✦ Deploy to Vercel

1. Push this repo to GitHub.
2. Import it at [vercel.com/new](https://vercel.com/new) (Next.js is
   auto-detected).
3. Add the environment variables from `.env.example` in the Vercel project
   settings.
4. Deploy.

The reading route requests a 300s `maxDuration` (honoured up to your Vercel
plan's ceiling — 300s on Pro, capped to 60s on Hobby) because it runs three
sequential Claude passes. It runs on the **Node.js runtime** (required by the
ephemeris and the Anthropic SDK) and streams each pass to avoid HTTP timeouts.

## ✦ Customizing the reading voice

The astrologer personas live in [`src/lib/pipeline.ts`](src/lib/pipeline.ts):
`JUDGMENT_SYSTEM` (what evidence to weigh), `COMPOSITION_SYSTEM` (voice,
integrity, and the section shape of every reading), `ETHICS_SYSTEM` (the
ethical-alignment audit), `VERIFY_SYSTEM` (the integrity audit), and
`STUDY_NOTES_SYSTEM` (the practitioner's notebook). Edit them there to retune
the craft. The deterministic astrology it all builds on lives in
[`src/lib/analysis/`](src/lib/analysis).

### Choosing a model per pass

Each of the five passes picks its model from `MODELS` in
[`src/lib/pipeline.ts`](src/lib/pipeline.ts), and every pass is independently
overridable by environment variable — so the pipeline can be tiered for cost or
latency without a code change. All passes default to **`claude-opus-4-8`**;
`ANTHROPIC_MODEL` sets the default for all at once, and the per-pass vars
(`ANTHROPIC_MODEL_JUDGMENT`, `…_COMPOSITION`, `…_ETHICS`, `…_VERIFICATION`,
`…_STUDY_NOTES`) override individual passes. The ethics and verification
**rewrites** always run on the composition model, so the finished reading stays
at composition grade no matter how cheaply the audits are tiered. See
[`.env.example`](.env.example) for a ready cost-tiered profile.

## ✦ On the astronomy

Charts are cast with the **Swiss Ephemeris** — the same library professional
astrologers rely on — via `sweph-wasm`, a WebAssembly build. It runs in **full
Swiss mode** (`SEFLG_SWIEPH`) against the **JPL-DE431-derived `.se1` data
files**, the authoritative, sub-arcsecond source. The two files covering
1800–2400 AD (main planets incl. Pluto + Moon, ~1.8 MB) ship with the package;
at startup we load their bytes directly into the Emscripten in-memory
filesystem and point Swiss Ephemeris at them — so there is **no runtime CDN
fetch and no native compilation**.

Positions are true geocentric apparent longitudes in the tropical zodiac of
date. Houses are **Placidus** (whole-sign fallback at extreme latitudes)
computed from the Swiss `swe_houses` Ascendant/Midheaven.

**Time zones are resolved properly**, so the Ascendant and houses are accurate:
the geocoded coordinates are mapped to their civil IANA zone (`tz-lookup`), and
the local time of death is converted to UTC with `luxon`, applying daylight
saving and historical zone rules from the IANA database — no external service.
The resolved zone is recorded on the chart (`chart.timezone`) and shown in the
UI. (For border-exact zone resolution, `geo-tz` can replace `tz-lookup`.)

Auto-detection is the default, but the form offers an **optional time-zone
override** (shown once a time of death is entered, defaulting to "Detect from
place") for ambiguous places or when the family knows the zone better than the
geocoder. A supplied zone is validated and takes precedence over the lookup;
it even works with no place at all, yielding an accurate UTC instant (and so
accurate planetary and Moon positions) without houses. If the data files
can't be loaded, or a date falls outside their range, the engine falls back —
per body — to Swiss Ephemeris's built-in analytical **Moshier** model (still
arcsecond-accurate), so a reading is always produced. The chart records which
source was used (`chart.ephemeris`), shown in the UI and passed to the reading.

The WASM module is instantiated from its binary bytes (read via `fs`), which
sidesteps the Emscripten `fetch` loader that doesn't work under Node. Three Next
settings make this production-safe (see `next.config.mjs`): `sweph-wasm` is a
`serverExternalPackage`, and `outputFileTracingIncludes` bundles the `.wasm`
binary **and the two `.se1` files** into the serverless function (the full
multi-hundred-MB ephemeris set is not shipped).

### Widening the date range or adding bodies

The bundled `sepl_18.se1` / `semo_18.se1` cover 1800–2400 AD and every body this
app computes. For dates outside that range or additional points (asteroids,
fixed stars), add the relevant `.se1` files — they're under
`node_modules/sweph-wasm/dist/ephe/`, or from
[astro.com/ftp/swisseph/ephe](https://www.astro.com/ftp/swisseph/ephe/) — to
both `EPHE_FILES` in [`src/lib/astrology.ts`](src/lib/astrology.ts) and
`outputFileTracingIncludes` in `next.config.mjs`. That file is the single seam;
the rest of the app is unchanged.

## ✦ The logo

A crisp SVG brand mark ships in `src/components/logo.tsx`. To use the exact
supplied artwork, save it as `public/logo.png` — see
[`public/README.md`](public/README.md).

---

<div align="center">
<sub>Offered as contemplative comfort. Not a substitute for medical, legal, or grief-care services.</sub>
</div>
