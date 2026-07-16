# GraveSigns — Build Plan: Professional Death-Chart Reading Engine

> ⚠️ **HISTORICAL — largely superseded.** This is the original blueprint. The
> engine has since been **built and evolved well past it**: the pipeline is now
> **six passes** (Judgment → Synthesis → Composition → Ethics → Verification →
> Study Notes), **model-tiered** (Opus 4.8 for the reading, Sonnet 5 for the
> ancillary passes), and it draws on a large retrieval-backed interpretive
> **corpus** (`src/lib/knowledge/`). Treat the "3 Sonnet passes (A/B/C)" and
> model notes below as **history, not current state.** For the current
> architecture see **`CLAUDE.md`**, the **README**, and the **Addendum** at the
> end of this file.

Status (original): **plan / not yet implemented.** This document consolidates four
source-grounded research passes (chart rendering, analysis math, sky/solar data,
professional method) into a concrete architecture, reference data, and a phased
build.

---

## 0. The problem and the two levers

The current reading is thin because it is (a) **text-only** — none of the visual
*instruments* a professional reads — and (b) **not computing the real analytical layers**
(dignities, patterns, lots, fixed stars, the 8th-house complex). Two levers fix it:

1. **Compute more deterministically, render it as visual evidence.** Most of this needs
   **no new data** — we already have the positions/houses/aspects.
2. **Optionally collect the deceased's birth data** (date/time/place). The serious death
   tradition (natal 8th house + ruler, hyleg/alcocoden/anareta length-of-life, primary
   directions, the natal+death **bi-wheel**) lives in the *natal* chart. Without birth
   **time**, we can only do an honest **event-chart** reading of the moment itself.

**Non-negotiable principle:** the AI never computes astronomy or dignities. A professional
instantly catches a hallucinated degree. All numbers come from deterministic code; the AI
only *judges, composes, and verifies*.

---

## 1. Orchestration architecture (the pipeline)

```
                          ┌───────────────────────────────────────────────┐
  Form submit ──────────► │ STEP 0 — Deterministic Engine (TypeScript)     │
  (death moment           │  Swiss Ephemeris chart + analysis:             │
   + optional birth)      │  positions, Placidus houses, Asc/MC, aspects,  │
                          │  sect, essential+accidental dignities & scores,│
                          │  almuten, aspect patterns, chart shape, lots,  │
                          │  fixed-star hits (swe_fixstar2), 8th complex,  │
                          │  [if birth data] natal chart + hyleg/anareta   │
                          └───────────────┬───────────────────────────────┘
                                          │ structured chart+analysis JSON (persisted to Supabase)
                          ┌───────────────▼───────────────────────────────┐
                          │ PASS A — Astrologer's Judgment (Sonnet → JSON) │
                          │  applies the professional protocol, RANKS the  │
                          │  evidence, tags tradition/modern + birthtime-  │
                          │  dependence, forbids single-factor verdicts.   │
                          └───────────────┬───────────────────────────────┘
                                          │ ranked evidence dossier (JSON)
                          ┌───────────────▼───────────────────────────────┐
                          │ PASS B — Compassionate Composition (Sonnet)    │
                          │  writes the sectioned reading from the dossier,│
                          │  translates technique → meaning, guardrails on.│
                          └───────────────┬───────────────────────────────┘
                                          │ reading markdown
                          ┌───────────────▼───────────────────────────────┐
                          │ PASS C — Verification (Sonnet, cheap)          │
                          │  checks every claim in the prose against the   │
                          │  Step-0 chart facts; flags/repairs mismatches. │
                          └───────────────┬───────────────────────────────┘
                                          │ verified reading
   FRONTEND ◄────────────────────────────┴─── renders VISUALS from Step-0 data
   (chart wheel, aspectarian, dignity table, mortality panel, moon, sky map…)
```

- **Passes A/B/C are three Sonnet calls.** A emits structured JSON (`messages` structured
  output), B streams prose, C is a cheap consistency check. If you want it leaner, fold C
  into deterministic code checks and run 2 passes — but C is what makes it safe to show a
  professional, so it is recommended.
- **Visuals are rendered by front-end SVG/Canvas from Step-0 data**, not by the AI. Pass A
  may emit `emphasize[]` hints (e.g. "highlight the 8th cusp, Algol-on-Mars") that the UI
  reads to spotlight elements.
- **Supabase** stores the Step-0 chart+analysis and each pass's output, so the pipeline is
  auditable and re-runnable.

---

## 2. Step 0 — the deterministic analysis engine

New module `src/lib/analysis/` (pure TypeScript, no AI). Two tiny prerequisites in
`src/lib/astrology.ts` unlock most of it:

- **Persist the 12 house cusps + Asc/MC longitudes** (`houseCusps[1..12]`,
  `ascendantLon`, `midheavenLon`) — already computed by `swe_houses`, currently discarded.
- **Add the quincunx (150°)** (+ semisextile 30°) to the aspect set (needed for Yods).
- Compute **sect** (day if Sun in houses 7–12 / above horizon, else night) — gates half of
  the traditional rules.

### 2.1 Essential dignities (hard-code these tables; cross-check against `flatlib`)

Point scheme (Lilly): **Domicile +5, Exaltation +4, Triplicity +3, Term +2, Face +1;
Detriment −5, Fall −4, Peregrine −5** (peregrine = none of the five positive dignities).

Rulership / exaltation(deg) / detriment / fall:

| Sign | Domicile | Exalt | Detriment | Fall |
|---|---|---|---|---|
| Aries | Mars | Sun 19° | Venus | Saturn 21° |
| Taurus | Venus | Moon 3° | Mars | — |
| Gemini | Mercury | — | Jupiter | — |
| Cancer | Moon | Jupiter 15° | Saturn | Mars 28° |
| Leo | Sun | — | Saturn | — |
| Virgo | Mercury | Mercury 15° | Jupiter | Venus 27° |
| Libra | Venus | Saturn 21° | Mars | Sun 19° |
| Scorpio | Mars | — | Venus | Moon 3° |
| Sagittarius | Jupiter | — | Mercury | — |
| Capricorn | Saturn | Mars 28° | Moon | Jupiter 15° |
| Aquarius | Saturn | — | Sun | — |
| Pisces | Jupiter | Venus 27° | Mercury | Mercury 15° |

**Triplicity (Dorothean, default) — Day / Night / Participating:**
Fire = Sun / Jupiter / Saturn · Earth = Venus / Moon / Mars · Air = Saturn / Mercury /
Jupiter · Water = Venus / Mars / Moon.

**Egyptian terms** (the version most often gotten wrong — this is the authenticated one,
byte-verified vs flatlib; degrees are `[start,end)` within the sign):

```
Aries    Jup0–6  Ven6–12  Mer12–20 Mar20–25 Sat25–30
Taurus   Ven0–8  Mer8–14  Jup14–22 Sat22–27 Mar27–30
Gemini   Mer0–6  Jup6–12  Ven12–17 Mar17–24 Sat24–30
Cancer   Mar0–7  Ven7–13  Mer13–19 Jup19–26 Sat26–30
Leo      Jup0–6  Ven6–11  Sat11–18 Mer18–24 Mar24–30
Virgo    Mer0–7  Ven7–17  Jup17–21 Mar21–28 Sat28–30
Libra    Sat0–6  Mer6–14  Jup14–21 Ven21–28 Mar28–30
Scorpio  Mar0–7  Ven7–11  Mer11–19 Jup19–24 Sat24–30
Sagitt.  Jup0–12 Ven12–17 Mer17–21 Sat21–26 Mar26–30
Capric.  Mer0–7  Jup7–14  Ven14–22 Sat22–26 Mar26–30
Aquarius Mer0–7  Ven7–13  Jup13–20 Mar20–25 Sat25–30
Pisces   Ven0–12 Jup12–16 Mer16–19 Mar19–28 Sat28–30
```

**Faces/decans (Chaldean order):** generate algorithmically — order
`[Mars, Sun, Venus, Mercury, Moon, Saturn, Jupiter]`, `face[n] = order[n % 7]`, n=0 at 0°
Aries (10° each).

**Accidental dignities** (Lilly's p.115 point table): house placement (+5 in 1/10, +4 in
7/4/11, +3 in 2/5, +2 in 9, +1 in 3; −5 in 12, −2 in 6/8), retrograde −5, combust (≤8°30′)
−5, under beams (8°30′–17°) −4, cazimi (≤17′) +5, oriental/occidental by planet class ±2,
etc. Also compute **almuten of a degree** and optionally **Almuten Figuris**.

### 2.2 Arabic Lots — the headline instrument for a death product

- **Part of Fortune** (sect-reversed / Paulus): day `Asc + Moon − Sun`, night
  `Asc + Sun − Moon`. Spirit is the mirror.
- **Lot of Death — compute BOTH variants and display side by side** (sources genuinely
  disagree; the reading should cite which):
  - A (Ascendant/Paulus form): `Asc + cusp8 − Moon`
  - B (Saturn/Dorothean-Bonatti form): `Saturn + cusp8 − Moon`
  - Neither is sect-reversed. Read by sign/house/ruler as an *ending-theme*, never a lifespan.

### 2.3 Aspect patterns + chart shape

Detect from the aspect matrix (tighten to ~6° for patterns): **Stellium, T-Square, Grand
Cross, Grand Trine, Kite, Yod, Mystic Rectangle, Grand Sextile**; plus the **Marc Edmund
Jones shapes** (Splash, Bundle, Bowl, Bucket, Locomotive, Seesaw, Splay) by sorting the
planet longitudes and analyzing the gaps.

### 2.4 Death-specific analysis

- **8th-house complex:** cusp sign, its ruler + condition, occupants, ruler's dispositor.
- **4th & 12th** rulers/occupants (the grave / the dissolution).
- **Mortal significators:** Saturn, Mars, Moon, Sun, Nodes (Pluto flagged modern) with
  house/dignity/angularity/aspects-to-luminaries-&-angles.
- **Anaretic 29° flags** (and 0° critical) on any body or angle.
- **Fixed-star conjunctions** — see 2.5.

### 2.5 Fixed stars — compute live, do not hard-code

Swiss Ephemeris ships **`sefstars.txt`**; call **`swe_fixstar2_ut(name, jd, iflag, …)`**
to get exact ecliptic longitude at the death instant (precession + proper motion applied).
Bundle only a small JSON of curated **death-associated star names + interpretive text +
orb** (Algol, the 4 Royal Stars Aldebaran/Regulus/Antares/Fomalhaut, Scheat, Facies,
Vindemiatrix, Alcyone/Pleiades, Capulus, Praesepe…), positions fetched at read time. Flag
any body/angle within ≤1° of a death star with Brady/Robson character words.

### 2.6 [Optional] Natal chart + length-of-life (only if birth data collected)

If birth date/time/place are provided, compute a second (natal) chart and run **Protocol B**:
sect → **hyleg** (5 candidates in the 5 prorogative places, day/night rules) → **alcocoden**
(almuten of hyleg degree) → its **planetary-years** tier → **anareta**. Compute the
year-figure **only as an internal `vitality_weight` flagged `do_not_surface`** — never shown.
Enables the **bi-wheel** and transit/direction timing.

### 2.7 Configurable scheme constants (sources genuinely disagree — store the choice)

1. **Triplicity:** Dorothean 3-ruler (default) vs Ptolemaic/Lilly 2-ruler.
2. **Part of Fortune sect reversal:** Paulus reverse (default) vs Ptolemy/Lilly no-reverse.
3. **Lot of Death formula:** show **both** (Asc-based + Saturn-based); cusp vs whole-sign 8th.

Validate the engine's numbers against **flatlib** (dignities/terms/almuten — tables above
are from its source), **kerykeion/astrology-api** (Almuten Figuris), and **Astro-Seek**
(lots, Part of Fortune).

---

## 3. The AI pipeline prompts

### Pass A — "Astrologer's Judgment" (Sonnet → structured JSON)
Role: expert traditional+modern astrologer doing **judgment only** (no prose, no comfort).
Ordered procedure: compute/confirm sect → detect mode (event-chart vs natal-with-time, list
`suppressed_techniques[]` when no birth time) → [if natal] hyleg/alcocoden/anareta → score
8th/4th/12th → enumerate mortal significators → both Lots of Death → fixed-star hits →
manner-of-death **theme tokens** (hard-blocked from literal cause) → timing lights.
Output per factor: `{factor, source, tradition_vs_modern, weight 0–1, direction
(aggravating/mitigating/neutral), condition_notes, birthtime_dependent, theme_tokens[]}`,
then a **ranked** list (condition > angularity > sect > concordance > single-flag), a
`concordance` requirement (**forbid single-factor verdicts**, per Lilly), `confidence`,
`suppressed_techniques[]`, and an `indeterminate` flag where the tradition fails. Hard gate:
**no lifespan/date/age/cause**; every factor cites its source layer and tradition-vs-modern tag.

### Pass B — "Compassionate Composition" (Sonnet → prose)
Role: humane astrologer-counselor (Forrest/Green voice). Never recomputes or reranks. Opens
by **naming the frame** (symbolic/contemplative, not prediction/medicine/validated science).
Leads with the highest-ranked, most-concordant themes; translates every token to
transformational meaning; **honors `indeterminate`/`suppressed_techniques` gracefully**
("with no birth time, the chart speaks in broader strokes"); closes with care + a gentle
support off-ramp. Guardrails absolute: no timeframe/age/cause/diagnosis; "invites reflection
on / symbolizes," never "you will." The `do_not_surface` fields are never passed to B.

Sectioned output, each with a **"Supporting Evidence"** line citing the concrete factors:
- *Tier 1 (always):* The Moment of Passing · The Character of the Passing · The Attending
  Powers · Stars of Fate · The Soul's Journey & Words of Solace.
- *Tier 2 (birth data unlocked):* The Giver and the Releaser (hyleg/anareta) · The House of
  Death (8th) · The Grave and the Dissolution (4th/12th) · The Part of Death · The Timing of
  the Threshold (transits/directions).

### Pass C — Verification (Sonnet, cheap)
Given the prose + the Step-0 chart facts, flag/repair any claim whose sign/house/aspect
doesn't match the computed chart, and any guardrail breach (a surfaced timeframe/cause).

Model: `claude-sonnet-5` (per env). Structured output for A, streaming for B.

---

## 4. Front-end display layer (self-contained SVG/Canvas, no CDN)

**The one transform** (Ascendant pinned to 9 o'clock, CCW zodiac); use it for zodiac
boundaries, planets, Placidus cusps, and outer transit ring alike:
```
θ = 180 + (λ − ascendantLon)      // degrees
x = cx + R·cos(θ·π/180)
y = cy − R·sin(θ·π/180)           // minus: SVG y is inverted
```
Both the fixed 30° zodiac ring and the *unequal* Placidus house spokes come from feeding
their respective longitudes through this **same** transform — that's what keeps planets in
the right sign *and* house automatically.

Components (priority order):
1. **Chart wheel** — zodiac ring (element tints) + 1°/5°/10° tick scale + planet ring (glyphs,
   degree, ℞, **collision fan-out with leader ticks**) + Placidus house spokes + aspect hub.
   Aspect lines colored **red = square/opposition, blue = trine/sextile, green = minor,
   conjunction neutral/gold**; line weight ∝ tightness. Highlight the **8th house**. Lift
   embedded SVG glyph `<path>` sets and default orb tables from **Kerykeion (MIT)**.
   Orbs (Kerykeion defaults): Conj 10, Opp 10, Trine 8, Sextile 6, Square 5, minors 1; add
   +0.3° when Sun/Moon is a member, +0.6° for Sun–Moon.
2. **Aspectarian** — the triangular aspect grid (glyph + orb per cell), the instrument pros
   scan first.
3. **Essential-dignities table** with per-planet score (color-scaled), peregrine/℞/combust chips.
4. **Aspect-pattern & chart-shape chips.**
5. **Mortality panel** — 8th house (cusp/ruler/occupants), malefic contacts, anaretic flags,
   both Lots of Death, fixed-star hits.
6. **Moon-phase disk** — `k = (1 − cos D)/2`, D = Moon−Sun elongation; two-arc SVG terminator;
   waxing if D<180 (lit right). Cheap, exact, most emotionally direct.
7. **Ecliptic band** — bodies on the 0–360° zodiac belt + fixed-star markers (works even with
   no known time).
8. **Sky dome** (premium) — real alt/az of stars/planets over the death place/time via the
   Meeus pipeline (GMST→LST→ε→ecliptic→equatorial→alt/az→azimuthal-equidistant projection);
   bundle **Yale BSC5** (public-domain, mag ≤ 6.5) + Stellarium `modern_iau` constellation
   lines. This dome also powers Brady **parans** (a legitimate fixed-star death technique).
9. **Bi-wheel** (needs birth data) — natal inner + death-moment outer; natal houses govern;
   cross-aspect chords with **tighter transit orbs (~1–2°)**.

**Skip / decorative-only:** heliocentric orrery, 3D star distances — astrologically
irrelevant (astrology is geocentric); never present as evidence.

---

## 5. Datasets, licensing, and validation

- **Swiss Ephemeris + `sefstars.txt`** — ⚠️ **dual-licensed AGPL-3.0 OR paid Astrodienst
  commercial license.** For a hosted premium product the AGPL network-copyleft is a real
  decision: either accept AGPL obligations (publish source) or budget for the commercial
  license. **This is a business/legal call to make before launch.**
- **Star map:** Yale **BSC5** (VizieR V/50, effectively public domain — cleanest to bundle)
  filtered to mag ≤ 6.5; or **HYG v4.2** (CC-BY-SA, richer names). Constellation lines:
  Stellarium `modern_iau` (MIT-relicensed western set, credit required).
- **Validate against:** flatlib (dignities/terms/almuten), kerykeion/astrology-api (Almuten
  Figuris), Astro-Seek (lots), Astrolog/Morinus (accidental + chart shapes).

---

## 6. Phasing

- **Phase 1 — no new data, biggest jump:** Step-0 engine (dignities, patterns, lots, fixed
  stars, 8th complex) + the 3-pass reading + wheel, aspectarian, dignities table, mortality
  panel, moon disk, ecliptic band. Turns "a few paragraphs" into an instrument-rich,
  evidence-cited report using the form exactly as it is today.
- **Phase 2 — birth data:** optional birth-details capture → natal chart → hyleg/alcocoden/
  anareta, **bi-wheel + cross-aspects**, transit/direction timing, Tier-2 reading sections.
  The real credibility unlock for a specialist.
- **Phase 3 — premium polish:** sky-dome star map + parans, declination / out-of-bounds,
  whole-sign toggle, PDF export.

---

## 7. Open decisions (need sign-off before building)

1. **Swiss Ephemeris license** — accept AGPL (open-source obligations) or buy the commercial
   license? (Affects the whole product legally.)
2. **Collect birth data?** Optional field unlocks the genuine tradition (Phase 2). Yes/No.
3. **Number of AI passes** — 3 (Judgment → Compose → Verify, recommended) or 2 (fold C into
   code checks)?
4. **Scheme defaults** — Dorothean triplicities, Egyptian terms, sect-reversed Fortune, and
   *both* Lot-of-Death formulas shown. (Recommended; all configurable.) Confirm or adjust.
5. **Starting scope** — Phase 1 only, 1+2, or everything.

---

## Appendix — source provenance (condensed)

- **Method:** Ptolemy *Tetrabiblos* III.10–11; Dorotheus *Carmen* III–IV; Valens *Anthology*
  III/VII; Bonatti *Liber Astronomiae*; Lilly *Christian Astrology* (1647); Hand *Night &
  Day* (sect); Houlding (houses, Ptolemy's terms, *Culture and Cosmos* 11); Brady *Book of
  Fixed Stars*; Gansten *Primary Directions*; Louis; Green *Pluto* / Forrest *Book of Pluto*.
- **Data (verified vs flatlib source):** essential dignities, Egyptian terms, Chaldean faces,
  Lilly point tables; Almuten Figuris (Ibn Ezra/Bonatti; kerykeion); Lots of Death (Paulus /
  Dorotheus-Bonatti; Skyscript).
- **Rendering:** Kerykeion (MIT) transform/orbs/glyph paths; astro.com/Solar Fire conventions;
  Unicode Misc. Symbols block.
- **Astronomy:** Meeus *Astronomical Algorithms* (sidereal time, obliquity, alt/az, phase);
  Swiss Ephemeris `swe_fixstar2` + `sefstars.txt`; Yale BSC5; Stellarium; Robson/Ebertin/Brady
  fixed-star corpus.

---

## Addendum — the reading-depth engine (post-launch sprint)

The launched pipeline computed rich chart *data* but gave the composer little
interpretive *doctrine*, so the prose read thin (~800–1200 words, 8 sections,
1–2 paragraphs each). This sprint added the missing meaning layer, on the
**legal path only** (original writing + public-domain sources; no commercial
licensing).

- **Interpretive corpus** (`src/lib/knowledge/documents/death-delineations.ts`)
  — ~139 factor-keyed delineations across families: Moon & Sun by sign, lunar
  phase, sect, element, modality, chart shape, the mortal significators, the
  karmic axis, the ruling hand, the rising sign (Ascendant by sign), planetary
  condition (dignity), aspect contacts (hard malefic / soft benefic), aspect
  patterns, the significators tenanting the death houses (8th/4th/12th occupants
  — the most direct testimony), the lord of the 8th by house, the specific
  luminary–malefic contacts (Moon–Saturn, Sun–Pluto, …), chart conditions
  (retrograde significator, anaretic/cusp degree), the 8th/4th/12th complex, the
  Lots, and the death-salient fixed stars. Written originally, grounded in the
  public-domain tradition (Ptolemy, Valens, Dorotheus, Firmicus, Lilly).
- **Targeted retrieval** (`src/lib/knowledge/index.ts`) —
  `selectDelineations(chart, analysis)` derives the factor keys actually present
  from the same deterministic analysis the visuals use, matches the corpus,
  ranks spine-first, caps, and folds only those entries into composition. Not a
  dump.
- **Public-domain primary text** (`classical-passages.ts`) — verbatim Ptolemy
  (Ashmand 1822) temperament passages, retrieved by the same keys, folded in as
  a secondary reference. Cause-/manner-of-death chapters excluded by policy.
- **Wider section architecture** (`src/lib/pipeline.ts`) — added *The Shape of
  the Whole*, *The Ruling Hand*, and *The Karmic Axis*; 2–4 paragraphs per
  section; ~1400–2000 words with a matching token ceiling across composition and
  both rewrites.
- **Sourcing policy** (`classical-sources.ts`) — a vetted bibliography splitting
  ingestible public-domain works from doctrine-only works whose modern
  translations remain under copyright.
- **Tests** (`knowledge.test.ts`) — vitest coverage of corpus integrity and the
  full retrieval seam, so the depth work is provable without a live model run.

**Next (still legal-path):** more delineation families (benefic *patterns*,
Ascendant/chart-ruler-by-sign); bulk ingest of Section-A public-domain text with
embedding-based retrieval for the classical layer; and encoding the pre-session
preparation labor (`docs/research/pre-session-preparation-labor.md`) as explicit
pipeline prep passes.
