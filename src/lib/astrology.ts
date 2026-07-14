/**
 * Death Chart calculation.
 *
 * Uses `astronomy-engine`, a high-precision pure-JavaScript ephemeris (VSOP87 /
 * modern models) that runs anywhere Node runs — no native bindings, no data
 * files — so it deploys cleanly to Vercel serverless functions. Geocentric
 * J2000 ecliptic longitudes are corrected to the tropical zodiac of date by a
 * precession term, matching the reference frame professional astrologers work
 * in. Swiss Ephemeris can be substituted here without changing the API surface.
 */
import { Body, GeoVector, Ecliptic, SiderealTime } from "astronomy-engine";
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

const PLANET_BODIES: { name: string; body: Body; canRetrograde: boolean }[] = [
  { name: "Sun", body: Body.Sun, canRetrograde: false },
  { name: "Moon", body: Body.Moon, canRetrograde: false },
  { name: "Mercury", body: Body.Mercury, canRetrograde: true },
  { name: "Venus", body: Body.Venus, canRetrograde: true },
  { name: "Mars", body: Body.Mars, canRetrograde: true },
  { name: "Jupiter", body: Body.Jupiter, canRetrograde: true },
  { name: "Saturn", body: Body.Saturn, canRetrograde: true },
  { name: "Uranus", body: Body.Uranus, canRetrograde: true },
  { name: "Neptune", body: Body.Neptune, canRetrograde: true },
  { name: "Pluto", body: Body.Pluto, canRetrograde: true },
];

const ASPECT_DEFS: { name: string; angle: number; orb: number }[] = [
  { name: "Conjunction", angle: 0, orb: 8 },
  { name: "Sextile", angle: 60, orb: 5 },
  { name: "Square", angle: 90, orb: 7 },
  { name: "Trine", angle: 120, orb: 7 },
  { name: "Opposition", angle: 180, orb: 8 },
];

function norm360(x: number): number {
  return ((x % 360) + 360) % 360;
}

function julianCenturies(date: Date): number {
  const jd = date.getTime() / 86400000 + 2440587.5;
  return (jd - 2451545.0) / 36525;
}

/** Mean obliquity of the ecliptic (degrees) */
function meanObliquity(T: number): number {
  return (
    23.439291111 -
    0.0130041667 * T -
    1.638889e-7 * T * T +
    5.036111e-7 * T * T * T
  );
}

/** Geocentric tropical (of-date) ecliptic longitude for a body, in degrees */
function eclipticLongitude(body: Body, date: Date, T: number): number {
  const vec = GeoVector(body, date, true);
  const ecl = Ecliptic(vec); // J2000 mean ecliptic
  // Precession correction from J2000 to the equinox of date (~50.29"/yr).
  const precession = (T * 100 * 50.290966) / 3600;
  return norm360(ecl.elon + precession);
}

/** Mean lunar North Node (degrees) — always retrograde in mean motion */
function meanNorthNode(T: number): number {
  return norm360(
    125.0445479 -
      1934.1362891 * T +
      0.0020754 * T * T +
      (T * T * T) / 467441 -
      (T * T * T * T) / 60616000
  );
}

function signFromLongitude(lon: number): { sign: string; degreeInSign: number } {
  const idx = Math.floor(norm360(lon) / 30) % 12;
  return { sign: SIGNS[idx], degreeInSign: norm360(lon) % 30 };
}

/** Placidus is intractable in pure JS; we use equal-house from the Ascendant. */
function houseFromLongitude(lon: number, ascLon: number): number {
  const diff = norm360(lon - ascLon);
  return Math.floor(diff / 30) + 1;
}

function computeAngles(
  date: Date,
  latitude: number,
  longitude: number,
  T: number
): { ascLon: number; mcLon: number } {
  const gast = SiderealTime(date); // Greenwich apparent sidereal time, hours
  const ramc = norm360(gast * 15 + longitude); // right ascension of MC, degrees
  const eps = meanObliquity(T);

  const ramcR = (ramc * Math.PI) / 180;
  const epsR = (eps * Math.PI) / 180;
  const latR = (latitude * Math.PI) / 180;

  const mcLon = norm360(
    (Math.atan2(Math.sin(ramcR), Math.cos(ramcR) * Math.cos(epsR)) * 180) /
      Math.PI
  );

  let ascLon = norm360(
    (Math.atan2(
      Math.cos(ramcR),
      -(Math.sin(ramcR) * Math.cos(epsR) + Math.tan(latR) * Math.sin(epsR))
    ) *
      180) /
      Math.PI
  );

  // The rising degree is always zodiacally ahead of the culminating degree.
  if (norm360(ascLon - mcLon) > 180) {
    ascLon = norm360(ascLon + 180);
  }

  return { ascLon, mcLon };
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

export function computeDeathChart(params: {
  dateOfDeath: string;
  timeOfDeath?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}): DeathChart {
  const { dateOfDeath, timeOfDeath, latitude, longitude } = params;
  const { date, timeKnown } = buildTimestamp(dateOfDeath, timeOfDeath, longitude);
  const T = julianCenturies(date);

  const locationKnown =
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    timeKnown; // houses only meaningful with both a time and a place

  let ascLon: number | null = null;
  let mcLon: number | null = null;
  if (locationKnown) {
    const angles = computeAngles(date, latitude as number, longitude as number, T);
    ascLon = angles.ascLon;
    mcLon = angles.mcLon;
  }

  const planets: PlanetPosition[] = PLANET_BODIES.map(({ name, body, canRetrograde }) => {
    const lon = eclipticLongitude(body, date, T);
    let retrograde = false;
    if (canRetrograde) {
      const later = new Date(date.getTime() + 2 * 86400000);
      const lonLater = eclipticLongitude(body, later, julianCenturies(later));
      // account for wrap-around
      let delta = lonLater - lon;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      retrograde = delta < 0;
    }
    const { sign, degreeInSign } = signFromLongitude(lon);
    return {
      name,
      longitude: lon,
      sign,
      degreeInSign,
      house: ascLon !== null ? houseFromLongitude(lon, ascLon) : null,
      retrograde,
    };
  });

  // North Node
  const nodeLon = meanNorthNode(T);
  const nodeSign = signFromLongitude(nodeLon);
  planets.push({
    name: "North Node",
    longitude: nodeLon,
    sign: nodeSign.sign,
    degreeInSign: nodeSign.degreeInSign,
    house: ascLon !== null ? houseFromLongitude(nodeLon, ascLon) : null,
    retrograde: true,
  });

  // Aspects (between the ten bodies + node)
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

  // Dominant element / modality across the personal planets + luminaries
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
    locationKnown: Boolean(locationKnown),
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
export function chartToText(chart: DeathChart, fullName: string): string {
  const fmt = (deg: number) => {
    const d = Math.floor(deg);
    const m = Math.round((deg - d) * 60);
    return `${d}°${String(m).padStart(2, "0")}'`;
  };

  const lines: string[] = [];
  lines.push(`Chart moment (UTC): ${chart.timestampUtc}`);
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
