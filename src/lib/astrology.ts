/**
 * Death Chart calculation — powered by the Swiss Ephemeris.
 *
 * We use `sweph-wasm`, a WebAssembly build of the Swiss Ephemeris (the same
 * C library professional astrologers rely on), running in **full Swiss mode**
 * (`SEFLG_SWIEPH`) against the JPL-DE431-derived `.se1` data files — the
 * authoritative, sub-arcsecond source astrologers expect. The `.se1` files
 * ship with the package; we load their bytes directly into the Emscripten
 * in-memory filesystem at init and point Swiss Ephemeris at them, so there is
 * no runtime CDN fetch and no native compilation. If the data files can't be
 * loaded (or a date falls outside their 1800–2400 AD range), we fall back to
 * Swiss Ephemeris's built-in analytical **Moshier** model (still arcsecond-
 * accurate), per body, so a reading is always produced.
 *
 * The WASM module is instantiated from its binary bytes (read via fs), which
 * avoids the Emscripten `fetch`-based loader that doesn't work in Node. The
 * instance is created once and reused across invocations.
 */
import { createRequire } from "module";
import path from "path";
import { readFileSync } from "fs";
import type { Aspect, DeathChart, PlanetPosition } from "./types";
import { resolveDeathMoment } from "./time";

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
  { name: "Semisextile", angle: 30, orb: 2 },
  { name: "Sextile", angle: 60, orb: 5 },
  { name: "Square", angle: 90, orb: 7 },
  { name: "Trine", angle: 120, orb: 7 },
  { name: "Quincunx", angle: 150, orb: 3 },
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
  SEFLG_SWIEPH: number;
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
  /** The underlying Emscripten module (FS + memory helpers). */
  wasm: EmscriptenModule;
}

interface EmscriptenModule {
  FS: {
    analyzePath(p: string, dontResolveLastLink?: boolean): { exists: boolean };
    mkdir(p: string): void;
    writeFile(p: string, data: Uint8Array): void;
  };
  lengthBytesUTF8(s: string): number;
  stringToUTF8(s: string, ptr: number, maxBytes: number): void;
  _malloc(n: number): number;
  _free(ptr: number): void;
  _swe_set_ephe_path(ptr: number): void;
}

const GREG_CAL = 1;

// Swiss data files covering 1800–2400 AD: main planets (incl. Pluto) + Moon.
// Enough for every body this app computes (Sun–Pluto, True Node).
const EPHE_FILES = ["sepl_18.se1", "semo_18.se1"];

interface SweInstance {
  swe: SwissEph;
  /** true when the Swiss .se1 data files were loaded into the WASM FS */
  epheLoaded: boolean;
}

// Cached, lazily-initialised Swiss Ephemeris instance (per server process).
let swePromise: Promise<SweInstance> | null = null;

/** Copy the .se1 bytes into the Emscripten in-memory FS and set the ephe path. */
function loadEphemerisFiles(swe: SwissEph, epheDir: string): boolean {
  try {
    const w = swe.wasm;
    if (!w.FS.analyzePath("/ephe").exists) w.FS.mkdir("/ephe");
    let loaded = 0;
    for (const f of EPHE_FILES) {
      try {
        const bytes = readFileSync(path.join(epheDir, f));
        w.FS.writeFile("/ephe/" + f, bytes);
        loaded++;
      } catch {
        // a missing file just means we lean on Moshier for that body
      }
    }
    if (loaded === 0) return false;
    // Point Swiss Ephemeris at the in-memory directory (native call).
    const p = "/ephe";
    const len = w.lengthBytesUTF8(p) + 1;
    const ptr = w._malloc(len);
    w.stringToUTF8(p, ptr, len);
    w._swe_set_ephe_path(ptr);
    w._free(ptr);
    return true;
  } catch {
    return false;
  }
}

async function getSwe(): Promise<SweInstance> {
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
    const swe = new SwissEPH(wasmModule) as SwissEph;

    const epheLoaded = loadEphemerisFiles(swe, path.join(wasmDir, "..", "ephe"));
    return { swe, epheLoaded };
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

export async function computeDeathChart(params: {
  dateOfDeath: string;
  timeOfDeath?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  timezone?: string | null;
}): Promise<DeathChart> {
  const { dateOfDeath, timeOfDeath, latitude, longitude } = params;
  // Resolve the exact UTC instant using the civil time zone at the place of
  // death (DST + historical rules), so the Ascendant and houses are accurate.
  // An explicit user-supplied zone overrides the geocoded lookup.
  const { date, timeKnown, timezone } = resolveDeathMoment(
    dateOfDeath,
    timeOfDeath,
    latitude ?? null,
    longitude ?? null,
    params.timezone ?? null
  );

  const { swe, epheLoaded } = await getSwe();
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

  // Prefer full Swiss mode (DE431 data files); fall back to the built-in
  // Moshier model per body if the files are absent or the date is out of range.
  const primaryFlag = epheLoaded ? swe.SEFLG_SWIEPH : swe.SEFLG_MOSEPH;
  const speed = swe.SEFLG_SPEED;
  let usedMoshierFallback = false;
  const calcBody = (ipl: number): number[] => {
    try {
      const r = swe.swe_calc_ut(jd, ipl, primaryFlag | speed);
      if (Number.isFinite(r?.[0])) return r;
    } catch {
      // fall through to Moshier
    }
    usedMoshierFallback = true;
    return swe.swe_calc_ut(jd, ipl, swe.SEFLG_MOSEPH | speed);
  };

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
    const r = calcBody(ipl);
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
      speed,
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

  // Sect: day when the Sun is above the horizon (houses 7–12). Falls back to a
  // diurnal default when no houses are available (no location/time).
  const sect: "day" | "night" =
    sun.house != null ? (sun.house >= 7 && sun.house <= 12 ? "day" : "night") : "day";

  const ephemeris = !epheLoaded
    ? "Swiss Ephemeris · Moshier model"
    : usedMoshierFallback
      ? "Swiss Ephemeris · Swiss data files (DE431), Moshier fallback for out-of-range bodies"
      : "Swiss Ephemeris · Swiss data files (DE431-derived)";

  return {
    timestampUtc: date.toISOString(),
    ephemeris,
    timezone,
    timeKnown,
    locationKnown: Boolean(locationKnown && ascLon !== null),
    latitude: typeof latitude === "number" ? latitude : null,
    longitude: typeof longitude === "number" ? longitude : null,
    ascendant: ascLon !== null ? signFromLongitude(ascLon) : null,
    midheaven: mcLon !== null ? signFromLongitude(mcLon) : null,
    ascendantLon: ascLon,
    midheavenLon: mcLon,
    houseCusps: cusps ?? [],
    sect,
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
  lines.push(`Ephemeris: ${chart.ephemeris} · tropical zodiac · Placidus houses`);
  lines.push(
    `Time of death known: ${chart.timeKnown ? "yes" : "no (noon assumed)"}; Location known: ${chart.locationKnown ? "yes" : "no"}`
  );
  if (chart.timezone) {
    lines.push(`Civil time zone at place of death: ${chart.timezone}`);
  }
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
