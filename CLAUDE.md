# CLAUDE.md — orientation for agents

GraveSigns casts a **death chart** (Swiss Ephemeris, the moment of passing) and
composes a tender, astrologer-grade written reading with Claude. Next.js 15 (App
Router) + TypeScript; Supabase optional (the app runs fully in demo mode without
it).

## The reading pipeline (the heart of the app)

`src/lib/pipeline.ts` → `runReadingPipeline()`. One deterministic step + **six
Claude passes**, each with a persona prompt (`*_SYSTEM`) in that file:

1. **Step 0** `computeChartAnalysis()` (`src/lib/analysis/`) — deterministic
   tabulation of every classical testimony (dignities, lots, patterns, fixed
   stars, the 8th/4th/12th complex, mortal significators). No AI. Serialized to a
   number-brief by `analysis/serialize.ts`.
2. **Pass A — Judgment** → a weighted evidence dossier (tool-forced JSON).
3. **Pass S — Synthesis** → an explicit reading plan (3–5 core themes + arc).
4. **Pass B — Composition** → the family-facing reading (Markdown prose).
5. **Pass E — Ethical Alignment** → audits against the loaded Code(s) of Ethics; one rewrite if misaligned.
6. **Pass C — Verification** → integrity audit; one rewrite if it fails.
7. **Pass N — Study Notes** → the practitioner's casebook (additive).

Each pass degrades gracefully (a failure returns the last good output). The
retrieved reference material (see below) is threaded into **every** pass, and
both rewrite paths, via `sourcesBlock()`.

### Models are TIERED by default
`MODELS` in `pipeline.ts`. Composition + both rewrites → **Opus 4.8** (the
reading); the five ancillary passes → **Sonnet 5** (`AUX_MODEL`). This is so the
six-pass request fits a serverless time limit. Overrides: `ANTHROPIC_MODEL`
(forces one model for all — set to `claude-opus-4-8` for the all-Opus showcase),
`ANTHROPIC_MODEL_AUX`, and per-pass `ANTHROPIC_MODEL_<PASS>`. See `.env.example`.

## The knowledge corpus + retrieval (`src/lib/knowledge/`)

This is what makes the reading deep. A generic, kind-based store loaded through
**one seam** (`index.ts`) — Supabase rows when configured, **bundled TS docs**
(`documents/`) as fallback, so a reading is never blocked. Kinds:

- `code_of_ethics` — NCGR code (the ethics passes align against it).
- `delineation` — ~139 **death-chart** interpretive entries, factor-keyed
  (`moon:Scorpio`, `occupant:8:Saturn`, `pair:Saturn-Moon`, `asc:Cancer`,
  `lord8:4`, `star:Algol`, …). `death-delineations.ts`.
- `natal_delineation` — 36 **natal-framed** entries (Sun/Moon/Ascendant by sign),
  for the Tier-2 "The Life That Was" section. `natal-delineations.ts`.
- `classical_source` — a legal-path **bibliography** (`classical-sources.ts`) and
  **verbatim public-domain Ptolemy passages** (`classical-passages.ts`).

**Retrieval is targeted, not a dump.** `activeFactorKeys(chart, analysis)`
derives the factor keys actually present; `selectDelineations` /
`selectNatalDelineations` / `selectClassicalPassages` match, rank spine-first
(`FAMILY_RANK`), and cap. To grow the corpus: add entries to a bundled doc (or a
Supabase row of the same shape) — **no code change** for a new entry; a new
factor *family* also needs a key emitted in `activeFactorKeys` + a `FAMILY_RANK`/
`FAMILY_HEADING` entry.

## Non-negotiable integrity rules

The reading **never** states or implies a **cause, manner, date, or length** of
death. It reads every factor as *meaning*, not mechanism. This is enforced in the
prompts AND in policy: e.g. the Ptolemy ingestion **excludes** the duration-/
kind-of-death chapters, and a test asserts no ingested passage carries
cause-of-death content. Preserve this in any new content or prompt.

## Legal-path sourcing (no commercial licensing)

Corpus grows only via **original writing** + **public-domain** sources (Ptolemy/
Ashmand 1822, Lilly 1647, Alan Leo, Sepharial, …). Works whose only modern
translations are under copyright (Valens, Dorotheus, Firmicus, Bonatti) are
**doctrine-only** — cite the idea, never store the text. See `classical-sources.ts`.

## Commands

- `npm run dev` — run locally (needs `ANTHROPIC_API_KEY` in `.env.local` to
  actually generate a reading).
- `npm test` — vitest suite over the retrieval/corpus engine
  (`src/lib/knowledge/knowledge.test.ts`). This is how the deterministic engine
  is verified **without** a live model call.
- `npm run lint` — next lint.
- `npm run build` — production build (proves the whole app compiles).

**Before committing non-trivial changes, run `tsc --noEmit`, `npm test`, `npm run
lint`, and `npm run build`.** They're all expected to pass.

## Gotchas

- **No live pipeline run in some environments.** If `ANTHROPIC_API_KEY` isn't in
  the env, you can't exercise the passes end-to-end — verify via tests/build; the
  felt prose depth needs a live run with a key.
- **Serverless timeout.** Six passes is heavy. On Vercel Hobby (60s cap on
  compute) the all-Opus profile times out — keep the tiered default there or use
  Pro (300s). A client `"...is not valid JSON"` error is the symptom of a
  function timeout returning a non-JSON body.
- The route (`src/app/api/readings/route.ts`) **awaits** the full pipeline and
  returns JSON — it does not stream to the client.
- `BUILD_PLAN.md` is the **original** 3-pass Sonnet blueprint and is largely
  superseded (see its banner). Trust `CLAUDE.md` + README for current state.

## Docs

- `docs/research/` — two cited, accredited-source research docs (reading-section
  taxonomy; pre-session preparation labor) that informed the corpus + Pass S.
