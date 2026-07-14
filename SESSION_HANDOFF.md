# GraveSigns — Session Handoff (resume in the morning)

_Last updated: 2026-07-14. Everything below is already on `main` (PR #2, squash `9d481c2`)._

## Where we are

The reading was rebuilt from a few prose paragraphs into a grounded, professional
death-chart reading with real visuals. All of `BUILD_PLAN.md` phases 0–3 plus the
AGPL license are **built, verified, merged to `main`, and (pending your redeploy)
ready to demo.**

Delivered and verified:
- **Step-0 deterministic engine** — `src/lib/analysis/` (dignities, Arabic lots,
  patterns, chart shape, fixed stars, 8th/4th/12th death complex). Verified vs a
  real Swiss Ephemeris chart.
- **Three-pass AI pipeline** — `src/lib/pipeline.ts` (Judgment → Composition →
  Verification). Wired + typechecked; not run live locally (no API key here).
- **Visual layer** — `src/components/chart/` (wheel, sky-dome, dignities table,
  aspectarian, mortality panel, moon phase, bi-wheel, casebook). Wheel/bi-wheel/
  sky-dome rendered and visually confirmed.
- **Tier 2 (birth details)** — natal chart, length-of-life doctrine, cross-aspects,
  bi-wheel. Math verified on worked examples.
- **Keepsake PDF** — print button + `@media print` in `globals.css`.

## BEFORE the next demo — two must-dos (not yet done)

1. **Supabase migration** (SQL editor) — new columns don't exist on the live DB yet.
   Readings still render without it, but the dossier + natal chart won't persist:
   ```sql
   alter table public.readings add column if not exists dossier jsonb;
   alter table public.readings add column if not exists natal_chart jsonb;
   ```
2. **Redeploy on Vercel** from `main`.

## Morning agenda — Tier 2 focus + voice

Priority order for the next session:

1. **Voice tuning (user flagged this is coming).** All three personas live in
   `src/lib/pipeline.ts`:
   - `JUDGMENT_SYSTEM` — what evidence to weigh.
   - `COMPOSITION_SYSTEM` — voice, integrity, the 8 section shape. **This is the
     main dial for tone.** `TIER2_ADDENDUM` adds the 3 natal sections.
   - `VERIFY_SYSTEM` — the integrity audit.
   Bring demo opinions; we tune tone/length/section shape here. Consider adding a
   couple of few-shot exemplars if a specific register is wanted.
2. **Tier 2 polish** — once redeployed, run a reading *with birth details* and judge:
   the "Life & Return" tab (bi-wheel + cross-aspects) and the three Tier-2 prose
   sections (The Life That Was / The Arc of Years / The Return). The length-of-life
   doctrine is deliberately **descriptive, never predictive** — keep it that way.
   Files: `src/lib/analysis/lifespan.ts`, `synastry.ts`, `serialize.ts`.
3. **Latency contingency (Pro upgrade).** Route asks for `maxDuration = 300`
   (`vercel.json` + `src/app/api/readings/route.ts`). Honored on **Pro**; **Hobby
   caps at 60s** → the 3 sequential passes can time out on long readings.
   - If timeouts hit regularly before upgrading: add a **fast 2-pass mode** (fold
     verification guardrails into `COMPOSITION_SYSTEM`, drop Pass C) behind an env
     flag, or stream Pass B to the client so the connection stays alive.
   - After upgrading to Pro: nothing to change — 300s already requested.

## Deliberately deferred (not built — decide if wanted)

- **Whole-sign house toggle** — would let the wheel switch house systems. Risk: the
  server-side analysis (dignities/accidentals/death factors) is Placidus, so a
  wheel-only toggle would disagree with the panels. Do it *properly* (recompute
  house-dependent factors per system) or not at all.
- **Declination / out-of-bounds** — needs ecliptic *latitude* per body, which we
  don't store (only longitude). Would require extending `computeDeathChart` to
  capture latitude from the ephemeris. Niche; low priority.
- **Constellation lines / larger star catalogue** on the sky dome — currently ~50
  bright stars, no figure lines. Cosmetic.

## Fast orientation for the next session

- **Pipeline:** `src/lib/pipeline.ts` (the 3 passes + prompts).
- **Astrology engine:** `src/lib/analysis/` — `index.ts` is the orchestrator
  (`computeChartAnalysis`), `serialize.ts` turns it into the AI evidence brief.
- **Chart data:** `src/lib/astrology.ts` (`computeDeathChart`, Swiss DE431).
- **API:** `src/app/api/readings/route.ts` (casts chart + optional natal, runs
  pipeline, persists).
- **Visuals:** `src/components/chart/chart-panel.tsx` is the tabbed entry point.
- **Blueprint / provenance:** `BUILD_PLAN.md`.
- **Branch:** develop on `claude/gravesigns-landing-prototype-v79km7` (freshly reset
  from `main`); open a *new* PR to `main` when ready — PR #2 is already merged.

### Rendering a visual to eyeball it (dev trick used this session)
JSX components need the automatic runtime; standalone `tsx` uses classic. Prepend
`import * as R from "react"; globalThis.React = R;`, render with
`renderToStaticMarkup`, write the SVG, wrap in minimal HTML, then screenshot with
the preinstalled Chromium:
`/opt/pw-browsers/chromium-*/chrome-linux/chrome --headless --no-sandbox --screenshot=out.png file://.../page.html`.

## Environment / infra notes

- Env vars (Vercel): `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` (default `claude-sonnet-5`),
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- Supabase key is server-only; never expose the service role to the browser.
- Demo mode: without Supabase, everything works end-to-end but nothing persists.
