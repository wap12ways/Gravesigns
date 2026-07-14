<div align="center">

# GraveSigns

### Death Chart Readings — a practice within the Truestherb platform

Compassionate, astrologer-grade readings of the sky at the moment a soul
crosses — for people and beloved pets alike.

</div>

---

GraveSigns casts a **true death chart** for the moment of passing (real
planetary positions, aspects, houses, and lunar phase from a high-precision
ephemeris) and composes a sophisticated, tender reading with **Claude Sonnet** —
written in the voice of a practitioner who has spent 20+ years with charts of
transition.

## ✦ Tech stack

- **Next.js 15** (App Router) + **TypeScript**
- **Tailwind CSS** + **shadcn/ui**-style components
- **Supabase** (Postgres) for storing readings
- **Anthropic Claude** (`claude-sonnet-5` by default) for reading generation
- **Swiss Ephemeris** via **sweph-wasm** (Moshier mode) — the astrologer's gold-standard ephemeris, compiled to WebAssembly, no native deps or data files
- **Vercel**-ready

## ✦ How it works

```
Form (name, date, optional time/place, human|pet, notes)
        │
        ▼
POST /api/readings
   1. Geocode the place (keyless Open-Meteo) when a time is also given
   2. computeDeathChart()  ──►  real positions, houses, aspects, Moon phase
   3. generateReading()    ──►  Claude composes the reading from the chart
   4. saveReading()        ──►  Supabase (no-op in demo mode)
        │
        ▼
Elegant chart summary + the composed reading
```

Only a **name** and **date of death** are required. Supplying a **time** and
**place** together unlocks the Ascendant, Midheaven, and house placements.

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
│   ├── reading-display.tsx        # chart + reading renderer
│   ├── chart-summary.tsx          # planet grid, aspects, angles
│   ├── logo.tsx / starfield.tsx / site-header.tsx
│   └── ui/                        # button, input, textarea, label, card
└── lib/
    ├── astrology.ts               # ephemeris → DeathChart
    ├── anthropic.ts               # system prompt + reading generation
    ├── supabase.ts                # persistence (graceful demo fallback)
    ├── markdown.ts                # tiny, safe MD → HTML
    └── types.ts
supabase/schema.sql               # the readings table + RLS
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
3. From **Project Settings → API**, copy into `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only — never expose to the browser)

The API routes write with the service-role key, so inserts succeed with RLS on.
A public **read** policy is included so the gallery renders; tighten it for
production.

## ✦ Deploy to Vercel

1. Push this repo to GitHub.
2. Import it at [vercel.com/new](https://vercel.com/new) (Next.js is
   auto-detected).
3. Add the environment variables from `.env.example` in the Vercel project
   settings.
4. Deploy.

`vercel.json` grants the reading route a 60s `maxDuration`. The reading route
runs on the **Node.js runtime** (required by the ephemeris and the Anthropic
SDK) and streams from Claude to avoid HTTP timeouts.

## ✦ Customizing the reading voice

The entire astrologer persona lives in `SYSTEM_PROMPT` in
[`src/lib/anthropic.ts`](src/lib/anthropic.ts) — a reusable, structured prompt
that specifies voice, technical integrity, and the eight-section shape of every
reading. Edit it there to retune tone or structure.

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
computed from the Swiss `swe_houses` Ascendant/Midheaven. If the data files
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
