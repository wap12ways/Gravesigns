/**
 * Death Chart calculation — powered by the Swiss Ephemeris.
 *
 * We use `sweph-wasm`, a WebAssembly build of the Swiss Ephemeris (the same
 * C library professional astrologers rely on), run in **Moshier mode**
 * (`SEFLG_MOSEPH`). Moshier is Swiss Ephemeris's built-in analytical model:
 * arcsecond-accurate and self-contained, so it needs none of the external
 * `.se1` data files — which keeps the app deployable on Vercel's serverless
 * filesystem with zero native compilation. To run in full Swiss mode instead,
 * ship the `.se1` sources, call `swe.swe_set_ephe_path(...)`, and drop the
 * `SEFLG_MOSEPH` flag; nothing else here changes.
 *
 * The WASM module is instantiated from its binary bytes (read via fs), which
 * avoids the Emscripten `fetch`-based loader that doesn't work in Node. The
 * instance is created once and reused across invocations.
 */
import { createRequire } from "module";
import path from "path";
import { readFileSync } from "fs";
import type { Aspect, DeathChart, PlanetPosition } from "./types";

const SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

const ELEMENTS: Record<string, string> = {
  Aries: "Fire", Leo: "Fire", Sagittarius: "Fire",
  Taurus: "Earth", Virgo: "Earth", Capricorn: "Earth",
  Gemini: "Air", Libra: "Air", Aquarius: "Air",
  Cancer: "Water", Scorpio: "Water", Pisces: "Water",
};

const MODALITIES: Record<string, string> = {
  Aries: "Cardinal", Cancer: "Cardinal", Libra: "Cardinal", Capricorn: "Cardinal",
  Taurus: "Fixed", Leo: "Fixed", Scorpio: "Fixed", Aquarius: "Fixed",
  Gemini: "Mutable", Virgo: "Mutable", Sagittarius: "Mutable", Pisces: "Mutable",
};

const ASPECT_DEFS: { name: string; angle: number; orb: number }[] = [
  { name: "Conjunction", angle: 0, orb: 8 },
  { name: "Sextile", angle: 60, orb: 5 },
  { name: "Square", angle: 90, orb: 7 },
  { name: "Trine", angle: 120, orb: 7 },
  { name: "Opposition", angle: 180, orb: 8 },
];

// Minimal typing for just the Swiss Ephemeris surface we use.
interface SwissEph {
  SE_SUN: number;
  SE_MOON: number;
  SE_MERCURY: number;
  SE_VENUS: number;
  SE_MARS: number;
  SE_JUPITER: number;
  SE_SATURN: number;
  SE_URANUS: number;
  SE_NEPTUNE: number;
  SE_PLUTO: number;
  SE_TRUE_NODE: number;
  SEFLG_MOSEPH: number;
  SEFLG_SPEED: number;
  swe_julday(y: number, m: number, d: number, hourUt: number, gregflag: number): number;
  swe_calc_ut(tjdUt: number, ipl: number, iflag: number): number[];
  swe_houses(
    tjdUt: number,
    geolat: number,
    geolon: number,
    hsys: string
  ): { cusps: number[]; ascmc: number[] };
  swe_close(): void;
}

const GREG_CAL = 1;

// Cached, lazily-initialised Swiss Ephemeris instance (per server process).
let swePromise: Promise<SwissEph> | null = null;

async function getSwe(): Promise<SwissEph> {
  if (swePromise) return swePromise;
  swePromise = (async () => {
    // Use a distinctly-named require handle so the bundler doesn't rewrite
    // these calls (webpack turns a literal `require.resolve(...)` into a
    // numeric module id). `sweph-wasm` is a serverExternalPackage, so this
    // loads it from node_modules at runtime.
    const nodeRequire = createRequire(import.meta.url);
    const factoryMod = nodeRequire("sweph-wasm/wasm/swisseph");
    const factory = factoryMod.default || factoryMod;
    const swephMod = nodeRequire("sweph-wasm");
    const SwissEPH = swephMod.default || swephMod;

    // Read the .wasm bytes directly and hand them to Emscripten, bypassing its
    // fetch-based loader (which fails under Node / serverless).
    const resolved = nodeRequire.resolve("sweph-wasm/wasm/swisseph");
    const wasmDir =
      typeof resolved === "string"
        ? path.dirname(resolved)
        : path.join(process.cwd(), "node_modules/sweph-wasm/dist/wasm");
    const wasmBinary = readFileSync(path.join(wasmDir, "swisseph.wasm"));

    const wasmModule = await factory({ wasmBinary });
    return new SwissEPH(wasmModule) as SwissEph;
  })();
  return swePromise;
}

function norm360(x: number): number {
  return ((x % 360) + 360) % 360;
}

function signFromLongitude(lon: number): { sign: string; degreeInSign: number } {
  const idx = Math.floor(norm360(lon) / 30) % 12;
  return { sign: SIGNS[idx], degreeInSign: norm360(lon) % 30 };
}

/** Whole/unequal house assignment from Swiss house cusps (index 1..12). */
function houseFromCusps(lon: number, cusps: number[]): number | null {
  const x = norm360(lon);
  for (let h = 1; h <= 12; h++) {
    const start = norm360(cusps[h]);
    const end = norm360(cusps[h === 12 ? 1 : h + 1]);
    const span = norm360(end - start);
    const off = norm360(x - start);
    if (span === 0 || off < span) return h;
  }
  return null;
}

function moonPhaseName(sunLon: number, moonLon: number): string {
  const phase = norm360(moonLon - sunLon);
  if (phase < 22.5 || phase >= 337.5) return "New Moon";
  if (phase < 67.5) return "Waxing Crescent";
  if (phase < 112.5) return "First Quarter";
  if (phase < 157.5) return "Waxing Gibbous";
  if (phase < 202.5) return "Full Moon";
  if (phase < 247.5) return "Waning Gibbous";
  if (phase < 292.5) return "Last Quarter";
  return "Waning Crescent";
}

/**
 * Build the UTC Date used for the chart. When no time is supplied we assume
 * local noon (a long-standing convention for undated charts), and when no
 * location is supplied we treat the supplied clock time as UTC.
 */
export function buildTimestamp(
  dateOfDeath: string,
  timeOfDeath: string | null | undefined,
  longitude: number | null | undefined
): { date: Date; timeKnown: boolean } {
  const [y, m, d] = dateOfDeath.split("-").map(Number);
  const timeKnown = Boolean(timeOfDeath && /^\d{1,2}:\d{2}$/.test(timeOfDeath));
  const [hh, mm] = timeKnown
    ? (timeOfDeath as string).split(":").map(Number)
    : [12, 0];

  // Rough local-time -> UTC conversion using longitude (15° per hour). Good
  // enough for a symbolic chart; a production build would resolve the true
  // civil timezone (including DST) from the location.
  const tzOffsetHours =
    typeof longitude === "number" ? Math.round(longitude / 15) : 0;

  const utcMillis = Date.UTC(y, m - 1, d, hh - tzOffsetHours, mm, 0);
  return { date: new Date(utcMillis), timeKnown };
}

export async function computeDeathChart(params: {
  dateOfDeath: string;
  timeOfDeath?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}): Promise<DeathChart> {
  const { dateOfDeath, timeOfDeath, latitude, longitude } = params;
  const { date, timeKnown } = buildTimestamp(dateOfDeath, timeOfDeath, longitude);

  const swe = await getSwe();
  const hourUt =
    date.getUTCHours() +
    date.getUTCMinutes() / 60 +
    date.getUTCSeconds() / 3600;
  const jd = swe.swe_julday(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    hourUt,
    GREG_CAL
  );
  const iflag = swe.SEFLG_MOSEPH | swe.SEFLG_SPEED;

  const locationKnown =
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    timeKnown; // houses only meaningful with both a time and a place

  // Houses + angles (Placidus, with a whole-sign fallback at extreme latitude)
  let cusps: number[] | null = null;
  let ascLon: number | null = null;
  let mcLon: number | null = null;
  if (locationKnown) {
    let h = swe.swe_houses(jd, latitude as number, longitude as number, "P");
    if (!Number.isFinite(h.ascmc?.[0]) || !Number.isFinite(h.cusps?.[1])) {
      h = swe.swe_houses(jd, latitude as number, longitude as number, "W");
    }
    if (Number.isFinite(h.ascmc?.[0])) {
      cusps = h.cusps;
      ascLon = norm360(h.ascmc[0]);
      mcLon = norm360(h.ascmc[1]);
    }
  }

  const bodyDefs: { name: string; ipl: number }[] = [
    { name: "Sun", ipl: swe.SE_SUN },
    { name: "Moon", ipl: swe.SE_MOON },
    { name: "Mercury", ipl: swe.SE_MERCURY },
    { name: "Venus", ipl: swe.SE_VENUS },
    { name: "Mars", ipl: swe.SE_MARS },
    { name: "Jupiter", ipl: swe.SE_JUPITER },
    { name: "Saturn", ipl: swe.SE_SATURN },
    { name: "Uranus", ipl: swe.SE_URANUS },
    { name: "Neptune", ipl: swe.SE_NEPTUNE },
    { name: "Pluto", ipl: swe.SE_PLUTO },
    { name: "North Node", ipl: swe.SE_TRUE_NODE },
  ];

  const planets: PlanetPosition[] = bodyDefs.map(({ name, ipl }) => {
    const r = swe.swe_calc_ut(jd, ipl, iflag);
    const lon = norm360(r[0]);
    const speed = r[3];
    const { sign, degreeInSign } = signFromLongitude(lon);
    return {
      name,
      longitude: lon,
      sign,
      degreeInSign,
      house: cusps ? houseFromCusps(lon, cusps) : null,
      retrograde: speed < 0,
    };
  });

  // Aspects between the bodies (tightest first).
  const aspects: Aspect[] = [];
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      let sep = Math.abs(planets[i].longitude - planets[j].longitude);
      if (sep > 180) sep = 360 - sep;
      for (const def of ASPECT_DEFS) {
        const orb = Math.abs(sep - def.angle);
        if (orb <= def.orb) {
          aspects.push({
            a: planets[i].name,
            b: planets[j].name,
            type: def.name,
            orb: Math.round(orb * 100) / 100,
          });
          break;
        }
      }
    }
  }
  aspects.sort((x, y) => x.orb - y.orb);

  // Dominant element / modality across the personal planets + luminaries.
  const personal = ["Sun", "Moon", "Mercury", "Venus", "Mars"];
  const elementCount: Record<string, number> = {};
  const modalityCount: Record<string, number> = {};
  for (const p of planets) {
    const weight = personal.includes(p.name) ? 2 : 1;
    elementCount[ELEMENTS[p.sign]] = (elementCount[ELEMENTS[p.sign]] || 0) + weight;
    modalityCount[MODALITIES[p.sign]] =
      (modalityCount[MODALITIES[p.sign]] || 0) + weight;
  }
  const dominantElement =
    Object.entries(elementCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Water";
  const dominantModality =
    Object.entries(modalityCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Cardinal";

  const sun = planets.find((p) => p.name === "Sun")!;
  const moon = planets.find((p) => p.name === "Moon")!;

  return {
    timestampUtc: date.toISOString(),
    timeKnown,
    locationKnown: Boolean(locationKnown && ascLon !== null),
    latitude: typeof latitude === "number" ? latitude : null,
    longitude: typeof longitude === "number" ? longitude : null,
    ascendant: ascLon !== null ? signFromLongitude(ascLon) : null,
    midheaven: mcLon !== null ? signFromLongitude(mcLon) : null,
    planets,
    aspects,
    dominantElement,
    dominantModality,
    moonPhase: moonPhaseName(sun.longitude, moon.longitude),
  };
}

/** Compact, human-readable summary of the chart for the AI prompt. */
export function chartToText(chart: DeathChart, _fullName: string): string {
  const fmt = (deg: number) => {
    const d = Math.floor(deg);
    const m = Math.round((deg - d) * 60);
    return `${d}°${String(m).padStart(2, "0")}'`;
  };

  const lines: string[] = [];
  lines.push(`Chart moment (UTC): ${chart.timestampUtc}`);
  lines.push(`Ephemeris: Swiss Ephemeris (Moshier), tropical zodiac`);
  lines.push(
    `Time of death known: ${chart.timeKnown ? "yes" : "no (noon assumed)"}; Location known: ${chart.locationKnown ? "yes" : "no"}`
  );
  if (chart.ascendant) {
    lines.push(
      `Ascendant: ${fmt(chart.ascendant.degreeInSign)} ${chart.ascendant.sign}`
    );
  }
  if (chart.midheaven) {
    lines.push(
      `Midheaven (MC): ${fmt(chart.midheaven.degreeInSign)} ${chart.midheaven.sign}`
    );
  }
  lines.push("");
  lines.push("PLANETARY POSITIONS:");
  for (const p of chart.planets) {
    const house = p.house ? ` — House ${p.house}` : "";
    const retro = p.retrograde ? " ℞ (retrograde)" : "";
    lines.push(`  ${p.name}: ${fmt(p.degreeInSign)} ${p.sign}${house}${retro}`);
  }
  lines.push("");
  lines.push(`Moon phase: ${chart.moonPhase}`);
  lines.push(`Dominant element: ${chart.dominantElement}`);
  lines.push(`Dominant modality: ${chart.dominantModality}`);
  lines.push("");
  lines.push("MAJOR ASPECTS (tightest first):");
  for (const a of chart.aspects.slice(0, 16)) {
    lines.push(`  ${a.a} ${a.type} ${a.b} (orb ${a.orb}°)`);
  }
  return lines.join("\n");
}
