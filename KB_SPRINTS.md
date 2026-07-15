# Knowledge Base — Sprint Backlog & Decision Log

**For the agent working this file:** the Brain is built **one source at a time**.
Do not bulk-load. Pick the **next unchecked item in priority order**, ingest that
**single source** end to end, verify it, check it off, then stop or continue to the
next. Each source is its own unit of work — its own commit, its own row(s) in
`kb_sources`. Follow the spec in `KNOWLEDGE_BASE_BUILD.md` for schema, chunking,
embeddings, and retrieval.

Statuses: `[ ]` not started · `[~]` in progress · `[x]` ingested & verified · `[!]` blocked (see note)

---

## Standard procedure for adding ONE source
1. Confirm the source meets criteria: public/legitimately obtainable, tracked provenance.
2. Acquire via the method noted (bulk / PDF / scrape / API).
3. Extract → clean → chunk (~600 tokens, keep headings).
4. Embed (Voyage `voyage-3`) → upsert into `kb_chunks`; create the `kb_sources` row with `title`, `author`, `tradition`, `authority_weight`, `provenance`, `content_hash`.
5. Verify: run 2–3 test retrievals against known topics; confirm citations resolve.
6. Check the box, note row counts + date, commit as `kb: ingest <source>`.
7. Move to the next item — never batch two sources into one pass.

---

## Sprint 0 — Foundation (do first, in order)
- [ ] Migrations live: `vector` extension, `kb_sources`, `kb_chunks`, `reference_charts`
- [ ] Ingestion script skeleton (`scripts/ingest`) with dedupe on `content_hash`
- [ ] Hybrid retrieval (pgvector + FTS + RRF) + Voyage `rerank-2`
- [ ] Step 0.5 retriever wired into `pipeline.ts`

## Sprint 1 — Reference corpus
- [ ] Astro-Databank **C-sample** → `reference_charts` (facts only) — bulk download
- [ ] Ephemeris validation pass over AA-rated births
- [ ] Reading-pipeline eval set from deceased subset

## Sprint 2 — Traditional / classical (public domain, PDF)
Priority order:
- [ ] Lilly — *Christian Astrology (1647)*
- [ ] Ptolemy — *Tetrabiblos*
- [ ] Dorotheus — *Carmen Astrologicum*
- [ ] Vettius Valens — *Anthologies* (Riley)
- [ ] Firmicus Maternus — *Mathesis*
- [ ] Manilius — *Astronomica*
- [ ] Bonatti · Al-Biruni · Abu Ma'shar
- [ ] Ramesey · Gadbury · Culpeper

## Sprint 3 — Fixed stars / mortality
- [ ] Robson — *Fixed Stars and Constellations* (PDF)
- [ ] Ebertin — *Fixed Stars and Their Interpretation* (PDF)
- [ ] Brady — *Book of Fixed Stars* / paran data (PDF)
- [ ] Swiss Ephemeris `sefstars.txt` (API, in-app)

## Sprint 4 — Reference sites (scrape)
- [ ] Skyscript.co.uk
- [ ] Constellations of Words
- [ ] Astro.com "Understanding Astrology" / Rob Hand
- [ ] Astro-Seek interpretation pages
- [ ] Deborah Houlding / Altair Astrology
- [ ] AstrologyKing

## Sprint 5 — Association / professional (PDF)
- [ ] AFA library
- [ ] ISAR (journals, method/ethics)
- [ ] NCGR journals
- [ ] Astrological Association (UK) — *Correlation*
- [ ] Kepler / Portland School material

## Sprint 6 — Modern / psychological (owned copies, PDF)
- [ ] Robert Hand — *Horoscope Symbols*, *Night & Day*
- [ ] Liz Greene / Sasportas — *Seminars in Psychological Astrology*
- [ ] Steven Forrest — *Book of Pluto*, *Inner Sky*
- [ ] Sue Tompkins — *Aspects in Astrology*
- [ ] Bernadette Brady — *Predictive Astrology*
- [ ] Richard Tarnas — *Cosmos and Psyche*

## Sprint 7 — Symbolic / cultural / death layer
- [ ] Sabian Symbols (Jones / Rudhyar)
- [ ] Decan & Egyptian star lore
- [ ] Theoi.com (mythology/archetype) — scrape
- [ ] Cross-cultural death customs / funerary lore — scrape

## Sprint 8 — Structured data / APIs
- [ ] Wikidata birth/death facts (SPARQL)
- [ ] Wikipedia biographies (REST / dumps)
- [ ] NASA JPL Horizons (astronomy cross-check)
- [ ] Sacred-texts.com astrology archive

---

## Agent rollout (deploy after the sources they read exist)
- [ ] Sect · Dignity · Lots · 8th/4th/12th complex
- [ ] Fixed-star & paran · Aspect-pattern · Lunar · Sabian-symbol
- [ ] Length-of-life · Cross-aspect/synastry · Cultural-context · Mythology/archetype
- [ ] Concordance · Citation/provenance · Contradiction/skeptic · B2B challenger

---

## Decision log (resolve before the affected sprint)
| # | Decision | Options | Status |
|---|---|---|---|
| 1 | Embeddings + rerank provider | Voyage `voyage-3` + `rerank-2` (recommended) / OpenAI / Cohere | **open** |
| 2 | Chunk size / overlap | ~600 tok / ~15% overlap (default) | **open** |
| 3 | `authority_weight` scale | associations & classics high, blogs low — set exact bands | **open** |
| 4 | Scrape sources: cache raw HTML? | yes (reproducible re-chunk) / no | **open** |
| 5 | B2B retrieval exposure | internal API route only / public API / both | **open** |
| 6 | Full Astro-Databank export later | pursue research license / stay on C-sample (recommended) | **open** |

**Note:** update the status boxes and this decision log as work lands — this file is the single source of truth for KB progress.
