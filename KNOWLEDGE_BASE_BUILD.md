# GraveSigns — Proprietary Knowledge Base ("The Brain") Build Spec

Consolidated spec: storage, ingestion, retrieval, full source catalog (with
acquisition method), and agent fleet. Research/spec only — nothing built.

Criteria applied to every source: **public / legitimately obtainable**, **depth
that raises reading quality (→ price)**, usable **B2C and B2B**, with tracked
**provenance** for real citations.

---

## 1. Storage — Supabase / pgvector

```sql
create extension if not exists vector;

create table kb_sources (
  id uuid primary key default gen_random_uuid(),
  title text, author text, publication text, url text,
  tradition text,            -- hellenistic | traditional | modern | vedic | medical | cultural | reference
  authority_weight real default 0.5,   -- association file/classic > blog
  provenance text,           -- origin + reuse status (drives citations)
  content_hash text unique
);

create table kb_chunks (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references kb_sources(id),
  heading text, body text,
  topics text[],             -- ['8th-house','saturn','lot-of-death','algol']
  embedding vector(1024),    -- Voyage voyage-3
  tsv tsvector
);
create index on kb_chunks using hnsw (embedding vector_cosine_ops);
create index on kb_chunks using gin (tsv);

-- reference corpus (Astro-Databank C-sample) — facts only, internal, no public RLS
create table reference_charts (
  id uuid primary key default gen_random_uuid(),
  adb_id text unique, full_name text, rodden_rating text,
  birth_date date, birth_time text, birth_place text, birth_lat double precision, birth_lon double precision,
  death_date date, death_time text, death_place text,
  source_url text, imported_at timestamptz default now()
);
```

**Ingestion:** `extract → clean → chunk (~600 tok, keep headings) → embed (Voyage voyage-3) → upsert`, dedupe on `content_hash`, background job in `scripts/ingest`.
**Retrieval:** hybrid (pgvector cosine + Postgres FTS, RRF) → rerank (Voyage `rerank-2`).
**Pipeline hook:** Step 0.5 Evidence Retrieval between `computeChartAnalysis()` and Pass A; retrieved passages ground `JudgmentFactor.source/concordance/confidence`.

---

## 2. Source catalog (add all; method per source)

### 2.1 Reference corpus
- **Astro-Databank C-sample** — bulk download (free ZIP/XML); facts → `reference_charts`; validate ephemeris + build reading eval set.

### 2.2 Traditional / classical (public domain — PDF)
- Ptolemy — *Tetrabiblos* — PDF (archive.org, sacred-texts)
- Lilly — *Christian Astrology (1647)* — PDF (archive.org, Skyscript)
- Dorotheus — *Carmen Astrologicum* — PDF (archive.org)
- Vettius Valens — *Anthologies* (Riley) — PDF (csus.edu, free)
- Manilius — *Astronomica* — PDF (LacusCurtius/Loeb)
- Firmicus Maternus — *Mathesis* — PDF (archive.org)
- Bonatti; Al-Biruni; Abu Ma'shar — PDF (archive.org)
- Ramesey, Gadbury, Culpeper — PDF (archive.org)

### 2.3 Fixed stars / mortality
- Robson — *Fixed Stars and Constellations* — PDF (archive.org, PD)
- Ebertin — *Fixed Stars and Their Interpretation* — PDF
- Brady — *Book of Fixed Stars* (star/paran data) — PDF
- Swiss Ephemeris `sefstars.txt` — API (`swe_fixstar2`, in-app)

### 2.4 Reference sites (scrape)
- Skyscript.co.uk (traditional) — scrape
- Constellations of Words (fixed stars/myth) — scrape
- Astro.com "Understanding Astrology" / Rob Hand articles — scrape
- Astro-Seek interpretation pages — scrape
- Deborah Houlding / Altair Astrology — scrape
- AstrologyKing (fixed stars/aspects) — scrape

### 2.5 Association / professional (PDF)
- AFA (American Federation of Astrologers) library — PDF
- ISAR (journals, method/ethics) — PDF
- NCGR journals — PDF
- Astrological Association (UK) — *Correlation* — PDF
- Kepler College / Portland School material — PDF/scrape

### 2.6 Modern / psychological (PDF — owned copies)
- Liz Greene; Sasportas — *Seminars in Psychological Astrology* — PDF
- Robert Hand — *Horoscope Symbols*, *Night & Day* (sect) — PDF
- Steven Forrest — *Book of Pluto*, *Inner Sky* — PDF
- Sue Tompkins — *Aspects in Astrology* — PDF
- Bernadette Brady — *Predictive Astrology* — PDF
- Richard Tarnas — *Cosmos and Psyche* — PDF

### 2.7 Symbolic / cultural / death layer
- Sabian Symbols (Jones / Rudhyar) — PDF/scrape
- Decan & Egyptian star lore — PDF (archive.org)
- Theoi.com (mythology/archetype) — scrape
- Cross-cultural death customs / funerary lore — scrape (Wikipedia, JSTOR-open)

### 2.8 Structured data / APIs
- Wikidata (birth/death facts, CC0 — commercially usable) — API (SPARQL)
- Wikipedia biographies — API (REST / dumps)
- NASA JPL Horizons (astronomy cross-check) — API
- Swiss Ephemeris — API (in-app)
- Sacred-texts.com astrology archive — scrape/PDF

---

## 3. Agent fleet (Step 0.5 + judgment/verify layers)

Retrieval agents (parallel, each filtered to its `tradition`/`topics` slice):
- **Sect** — day/night, benefic/malefic of sect
- **Dignity** — essential/accidental, almuten, peregrine
- **Lots** — Fortune, Lot of Death, Hermetic lots
- **8th/4th/12th complex** — rulers, occupants, dispositors
- **Fixed-star & paran** — Algol, royal stars, parans
- **Aspect-pattern** — T-square, yod, chart shape → meaning
- **Lunar** — phase, mansions, void-of-course, nodes
- **Sabian-symbol** — degree symbolism
- **Length-of-life** — hyleg/alcocoden (descriptive, natal only)
- **Cross-aspect / synastry** — death sky over natal
- **Cultural-context** — reads intake `notes`, matches tradition
- **Mythology/archetype** — Theoi/decan imagery

Judgment / control layer:
- **Concordance** — cross-checks agents, scores agreement/conflict
- **Citation/provenance** — attaches real sources, kills uncited claims
- **Contradiction/skeptic** — adversarially challenges the dossier
- **B2B challenger** — argues against an astrologer's manual reading, with sources

---

## 4. External dependency
- **Embeddings + rerank:** Voyage AI (`voyage-3`, `rerank-2`) — the one non-Anthropic piece (Anthropic has no embedding model).

## 5. Provenance rule
Every `kb_sources` row carries `provenance`; every surfaced claim cites a real chunk. Uncited claims are dropped by the citation agent.
