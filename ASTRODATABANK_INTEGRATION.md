# AstroDatabank Integration — Research & Decision

Status: **research / decision doc — nothing built.** This consolidates a
source-grounded investigation of the Astro-Databank (ADB) into a recommendation
for whether and how GraveSigns should use it. It answers a specific question that
came up in planning:

> Do I build custom browser automation to look up the data a user enters into the
> reading intake form? Or a separate AI function that fetches the search results,
> grabs the publications → Supabase (keyed to a reading) → back to the agent for
> the final reading? And why did I think I should store it myself?

**Short answer: neither, as a customer-facing feature.** Both options run into the
same three walls — license, coverage, and terms-of-service — not a scaling
problem. AstroDatabank's real value to GraveSigns is as an **internal R&D and
validation corpus**, and there is a clean, free, legitimate way to get that value
without storing or republishing the database. The rest of this doc explains why
and specifies the recommended path.

---

## 1. What Astro-Databank actually is

- A **wiki of ~75,000+ records of *notable people*** (celebrities, historical
  figures), founded by astrologer **Lois M. Rodden** and acquired by **Astrodienst
  AG** (astro.com) in 2008, run since as a collaborative MediaWiki.
- Its headline value is the **Rodden Rating** — a data-accuracy grade on each
  record:
  - **AA** — birth certificate / official record (gold standard)
  - **A** — from the person or family, memory-based
  - **B** — reputable biography / secondary source
  - **C** — "caution": hearsay, no direct source link
  - **DD** — "dirty data": conflicting times reported
  - Only **AA / A / B** are considered sound for study.
- Each record is fundamentally a **birth** record (date/time/place + biography +
  source citation); many notable figures also carry **death** data as events.

The critical framing: **ADB is a *birth* database of *famous* people.** GraveSigns
casts a **death** chart, and its customers are grieving families entering an
ordinary person — or a pet.

---

## 2. The three walls (this is the "tricky" you felt)

### Wall 1 — Coverage mismatch (product value ≈ 0 for real users)
The overlap between "people in AstroDatabank" and "people GraveSigns is actually
asked to read" is **nearly nil**. A live-lookup feature against the intake form
(the browser-automation option) would fire only for famous deaths and return
nothing for the ordinary humans and pets that are the entire customer base. It
solves a problem that barely exists.

### Wall 2 — License forbids the commercial + AI use we'd need
Confirmed from Astrodienst's own pages:
- **Data records** are offered for reuse **only in a non-commercial context**
  (copyright page). One page cites CC-BY-3.0; the copyright page frames reuse as
  non-commercial — a genuine ambiguity we should not build a commercial product on
  top of. Copyright is held by **Astrodienst AG**.
- The **official full-dataset export license** states, verbatim:
  > "Licenses to non-researchers are never granted. We also grant no licenses if
  > the aim is to use ADB data for training AI systems."
  GraveSigns is a commercial, non-researcher, AI-driven product — the license is a
  triple no.
- As of **March 30, 2026 the full ADB export is halted** ("overload of requests");
  the download and contract have been temporarily removed.
- **Biographical text and images** are separately copyrighted and **not** licensed
  for republication. The "grab the publications/bios → Supabase" half of the AI
  option copies exactly this protected layer.

### Wall 3 — Scraping violates the ToS and copies a protected compilation
Browser-automating or crawling the wiki breaches its terms and re-copies a
selected/arranged compilation that carries **database rights** (Swiss/EU) on top of
the per-record copyright. This is the wall the "store it myself" instinct trips on:
storing a mirror of the DB *is* republishing a copyrighted, commercially-restricted
compilation.

---

## 3. Why both proposed options are the wrong axis

| Option considered | What it is | Why it fails |
|---|---|---|
| **A. Browser automation off the intake form** | Live-scrape astro.com for whatever the user types | Wall 1 (≈0 hit rate for real customers), Wall 3 (ToS + copy), fragile at scale, adds latency to every reading |
| **B. AI fetch → grab publications → Supabase(reading_id) → agent** | An agent pulls search results + bios, stores them against a reading, feeds the final composition | Wall 2 (bios are the copyrighted layer; commercial + AI-training barred), Wall 1, and a **data-model error**: reference data is not a property of a reading |

The **data-model error** in Option B is worth naming on its own: reference charts
are their own entity. Keying them to a `reading_id` fuses a shared reference corpus
onto individual customer readings, so the same celebrity gets re-fetched and
re-stored per reading, can never be validated or reused cleanly, and mixes a
copyrighted external corpus into customer rows. They belong in a **separate table**,
not on `readings`.

**The correct axis is not "browser automation vs AI function." It is "live
customer feature vs internal research asset."** ADB is only viable as the latter.

---

## 4. The legitimate path — the free C-sample as an internal corpus

Astrodienst publishes a **free, unencrypted "C-sample"**: every record whose name
starts with **C** — **~5,800 records, ~4,800 of them AA/A rated** — offered under
CC-BY-3.0 with attribution, explicitly so people can build tools before requesting
full access. No license negotiation, no scraping, no commercial/AI fight (it's a
one-time static download used internally, not republished as product content).

Use it **internally only**, storing **facts, not prose**:

### 4.1 Engine validation (highest value, do this first)
For each AA-rated birth in the sample, compute the chart with our Swiss Ephemeris
pipeline (`src/lib/astrology.ts`) and diff our positions / Ascendant / houses
against the known-good reference. This directly de-risks the single thing the whole
product's credibility rests on — a professional instantly catches a wrong degree.
A drift report becomes a standing regression test.

### 4.2 Reading-pipeline eval set
The subset of C-sample figures who are **deceased with accurate death data** becomes
a fixed evaluation set for `src/lib/pipeline.ts`: run the three-pass reading over
real death moments and regression-check the invariants that already matter —
no fabricated placements (Pass C), no forbidden cause/manner/date claims, tone that
is safe to read in grief, structure intact. This is how you catch a pipeline
regression before a customer does.

### 4.3 Death-signature research (optional, the "gold standard" use)
The statistical-astrology use ADB was built for: across many accurate death charts,
which of the deterministic factors in `src/lib/analysis/` actually cluster? Purely
internal research to tune weights — never surfaced as prediction.

---

## 5. Recommended architecture

**A separate, internal reference table — not coupled to `readings`, facts only:**

```sql
-- Internal R&D only. NOT customer-facing. Facts, not biographies or images.
create table if not exists public.reference_charts (
  id            uuid primary key default gen_random_uuid(),
  adb_id        text unique,          -- ADB record id, for attribution/dedup
  full_name     text not null,
  rodden_rating text,                 -- 'AA' | 'A' | 'B' | 'C' | 'DD'
  birth_date    date,
  birth_time    text,                 -- 'HH:MM' or null
  birth_place   text,
  birth_lat     double precision,
  birth_lon     double precision,
  death_date    date,                 -- present only when ADB carries it
  death_time    text,
  death_place   text,
  source_url    text,                 -- attribution back to the ADB record (CC-BY)
  imported_at   timestamptz not null default now()
);
-- No biography text, no images (copyrighted, not licensed).
-- RLS: no public read policy. Internal/service-role access only.
```

Pipeline (a one-off script under e.g. `scripts/`, run manually, not in the app):

```
c_sample.zip (free download)
   → parse XML → keep FACTS only (name, RR, birth/death date-time-place, source url)
   → filter to AA/A (and B for eval breadth)
   → upsert into reference_charts (dedup on adb_id)
        │
        ├─►  validate: computeDeathChart()/natal on each → diff vs reference → drift report
        └─►  eval:     deceased subset → runReadingPipeline() → assert guardrails hold
```

Guardrails that keep this legitimate:
- **Facts only.** No biographical prose, no images ingested — those are the
  copyrighted layer.
- **Internal only.** `reference_charts` is never read by a customer-facing route
  and has no public RLS policy. It is R&D infrastructure, not product data.
- **Attributed.** `source_url` preserves CC-BY attribution to each ADB record.
- **Separate from `readings`.** No `reading_id` coupling — different entity,
  different lifecycle, different provenance.

---

## 6. If real celebrity-death coverage is ever wanted as a *feature*

If a future product line genuinely needs notable-death lookups (e.g. an editorial
"charts of famous passings" gallery), do it the licensed way, not by scraping:
1. **Email adbdata@astro.com** for the proper data-export license — but note it is
   currently **halted** and explicitly **excludes commercial and AI use**, so this
   likely requires a **direct commercial agreement** with Astrodienst, not the
   research export.
2. Or source facts from **non-restricted** databases (e.g. Wikipedia/Wikidata death
   dates, which are CC-licensed and commercially usable) — lower astrological
   pedigree, but no legal wall, and better real coverage for public figures.

Either way it is a **separate, opt-in editorial feature**, never wired into the
grieving-family intake flow.

---

## 7. Recommendation

1. **Do not** build browser automation off the intake form. (Walls 1 + 3.)
2. **Do not** build an AI fetch-and-store-bios feature keyed to readings.
   (Walls 1 + 2, plus the data-model error.)
3. **Do not** mirror AstroDatabank into Supabase as product data. That is the
   "store it myself" instinct, and it is the exact thing the license forbids.
4. **Do** ingest the **free C-sample** as an internal, facts-only
   `reference_charts` table and use it to (a) validate the ephemeris engine and
   (b) build a reading-pipeline eval set. Highest leverage, zero legal risk,
   directly strengthens the product's credibility.
5. Revisit a licensed, editorial celebrity-death feature only if/when there's a
   real product reason — via a commercial agreement or CC-licensed sources, never
   scraping, and always separate from the customer intake flow.

---

## 8. Open decisions (need sign-off)

1. **Scope of use** — internal validation only (§4.1), or validation + reading
   eval set (§4.1 + §4.2)? (Recommended: both.)
2. **Corpus source** — free C-sample only (recommended), or pursue the full export
   license later for a research angle (currently halted, anti-commercial/anti-AI)?
3. **Storage** — `reference_charts` in the same Supabase project (internal, no
   public RLS) vs. a fully separate internal store. (Recommended: same project,
   internal table, no public policy.)
4. **Celebrity-death feature** — out of scope for now (recommended), or spec a
   separately-licensed editorial line?

---

### Sources
- Astro-Databank Copyright — https://www.astro.com/astro-databank/Astro-Databank:Copyright
- Astro-Databank data export readme (license, C-sample, halt, AI/commercial exclusions) — https://www.astro.com/adbexport/00_readme.htm
- Rodden Rating definitions (Help:RR) — https://www.astro.com/astro-databank/Help:RR
- Astro-Databank main / scope (~celebrity birth data) — https://www.astro.com/astro-databank/Main_Page
- Astrodatabank background (founding, Astrodienst acquisition) — https://en.wikipedia.org/wiki/Astrodatabank
