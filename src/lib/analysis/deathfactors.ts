/**
 * The death-specific reading layer: the 8th-house complex and its companions
 * (4th = the grave / endings, 12th = undoing / confinement), the mortal
 * significators (Saturn, Mars, the Moon, the Nodes, and — read as moderns do —
 * Pluto), anaretic-degree flags, and hard malefic contacts.
 *
 * This is deterministic structure only. It never states a cause, a manner, or a
 * lifespan — it surfaces the classical testimonies for the AI judgment pass to
 * weigh. See BUILD_PLAN.md §2 and the professional-method notes in §1.4.
 */
import type { DeathChart, PlanetPosition } from "../types";
import { RULERSHIP, signFromIndex, type Sign } from "./reference";

function norm360(x: number): number {
  return ((x % 360) + 360) % 360;
}
function sep(a: number, b: number): number {
  const d = Math.abs(norm360(a) - norm360(b)) % 360;
  return d > 180 ? 360 - d : d;
}
function signOf(lon: number): Sign {
  return signFromIndex(Math.floor(norm360(lon) / 30) % 12);
}

/** Which house a longitude falls in, using the unequal Placidus cusps. */
function houseOf(lon: number, cusps: number[]): number | null {
  if (cusps.length < 13) return null;
  const l = norm360(lon);
  for (let h = 1; h <= 12; h++) {
    const s = norm360(cusps[h]);
    const span = norm360(norm360(cusps[h === 12 ? 1 : h + 1]) - s);
    const off = norm360(l - s);
    if (span === 0 || off < span) return h;
  }
  return null;
}

export interface HouseComplex {
  house: number;
  role: string;
  cuspLon: number | null;
  cuspSign: Sign | null;
  /** Traditional ruler of the sign on the cusp */
  ruler: string | null;
  /** Where that ruler sits (sign, house, retrograde) */
  rulerPlacement: { sign: string; house: number | null; retrograde: boolean } | null;
  /** Planets tenanting the house */
  occupants: string[];
}

const MORTAL = ["Saturn", "Mars", "Moon", "Sun", "Pluto"] as const;

export interface MortalSignificator {
  name: string;
  sign: string;
  house: number | null;
  retrograde: boolean;
  /** Why the tradition flags this body (surfaced, never asserted as cause) */
  note: string;
}

export interface AnareticFlag {
  body: string;
  degreeInSign: number;
  kind: "anaretic (29°)" | "cusp (0°)";
  note: string;
}

export interface MaleficContact {
  malefic: string;
  body: string;
  aspect: string;
  orb: number;
}

export interface DeathFactors {
  houses: HouseComplex[];
  mortalSignificators: MortalSignificator[];
  anaretic: AnareticFlag[];
  maleficContacts: MaleficContact[];
  /** True when the chart lacks houses/angles (no time or place) */
  angularityUnknown: boolean;
}

const HOUSE_ROLES: Record<number, string> = {
  8: "death, transformation, what is shared and surrendered",
  4: "the end of the matter, the grave, roots and closure",
  12: "undoing, confinement, sorrow, the hidden",
};

function buildHouseComplex(chart: DeathChart, house: number): HouseComplex {
  const hasCusps = chart.houseCusps.length >= 13;
  const cuspLon = hasCusps ? norm360(chart.houseCusps[house]) : null;
  const cuspSign = cuspLon != null ? signOf(cuspLon) : null;
  const ruler = cuspSign ? RULERSHIP[cuspSign] : null;

  let rulerPlacement: HouseComplex["rulerPlacement"] = null;
  if (ruler) {
    const rp = chart.planets.find((p) => p.name === ruler);
    if (rp) {
      rulerPlacement = {
        sign: rp.sign,
        house: rp.house ?? (hasCusps ? houseOf(rp.longitude, chart.houseCusps) : null),
        retrograde: rp.retrograde,
      };
    }
  }

  const occupants = chart.planets
    .filter((p) => {
      const h = p.house ?? (hasCusps ? houseOf(p.longitude, chart.houseCusps) : null);
      return h === house;
    })
    .map((p) => p.name);

  return {
    house,
    role: HOUSE_ROLES[house] ?? "",
    cuspLon,
    cuspSign,
    ruler,
    rulerPlacement,
    occupants,
  };
}

function mortalNote(p: PlanetPosition): string {
  switch (p.name) {
    case "Saturn":
      return "the Greater Malefic and natural significator of endings, time, and limitation";
    case "Mars":
      return "the Lesser Malefic — sudden, sharp, or forceful testimony";
    case "Moon":
      return "the body / the physical vessel and its final condition";
    case "Sun":
      return "the vital spirit and life-force";
    case "Pluto":
      return "modern significator of death and irrevocable transformation";
    default:
      return "significator of mortality";
  }
}

export function computeDeathFactors(chart: DeathChart): DeathFactors {
  const hasCusps = chart.houseCusps.length >= 13;
  const houses = [8, 4, 12].map((h) => buildHouseComplex(chart, h));

  // Mortal significators, annotated with their placement.
  const mortalSignificators: MortalSignificator[] = chart.planets
    .filter((p) => (MORTAL as readonly string[]).includes(p.name))
    .map((p) => ({
      name: p.name,
      sign: p.sign,
      house: p.house ?? (hasCusps ? houseOf(p.longitude, chart.houseCusps) : null),
      retrograde: p.retrograde,
      note: mortalNote(p),
    }));

  // Anaretic (29°xx) and 0° cusp degrees — a body "running out" of, or freshly
  // entering, a sign is a classic timing/intensity flag.
  const anaretic: AnareticFlag[] = [];
  for (const p of chart.planets) {
    if (p.degreeInSign >= 29) {
      anaretic.push({
        body: p.name,
        degreeInSign: p.degreeInSign,
        kind: "anaretic (29°)",
        note: `${p.name} at the final, "fated" degree of ${p.sign} — a matter run to its end`,
      });
    } else if (p.degreeInSign < 1) {
      anaretic.push({
        body: p.name,
        degreeInSign: p.degreeInSign,
        kind: "cusp (0°)",
        note: `${p.name} at the first degree of ${p.sign} — a threshold freshly crossed`,
      });
    }
  }

  // Hard contacts (conjunction / square / opposition) from the malefics to any
  // luminary or angle, read straight from the computed aspect list.
  const HARD = new Set(["Conjunction", "Square", "Opposition"]);
  const MALEFICS = new Set(["Saturn", "Mars", "Pluto"]);
  const maleficContacts: MaleficContact[] = [];
  for (const a of chart.aspects) {
    if (!HARD.has(a.type)) continue;
    const aM = MALEFICS.has(a.a);
    const bM = MALEFICS.has(a.b);
    if (aM === bM) continue; // need exactly one malefic end
    const malefic = aM ? a.a : a.b;
    const body = aM ? a.b : a.a;
    maleficContacts.push({ malefic, body, aspect: a.type, orb: Number(a.orb.toFixed(2)) });
  }
  // Also flag malefics tightly conjunct an angle (not in the planet-planet list).
  if (chart.ascendantLon != null || chart.midheavenLon != null) {
    for (const p of chart.planets) {
      if (!MALEFICS.has(p.name)) continue;
      for (const [ang, lon] of [
        ["Ascendant", chart.ascendantLon],
        ["Midheaven", chart.midheavenLon],
      ] as const) {
        if (lon == null) continue;
        const d = sep(p.longitude, lon);
        if (d <= 3) {
          maleficContacts.push({ malefic: p.name, body: ang, aspect: "Conjunction", orb: Number(d.toFixed(2)) });
        }
      }
    }
  }
  maleficContacts.sort((a, b) => a.orb - b.orb);

  return {
    houses,
    mortalSignificators,
    anaretic,
    maleficContacts,
    angularityUnknown: !hasCusps,
  };
}
