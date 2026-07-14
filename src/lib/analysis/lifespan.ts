/**
 * The traditional length-of-life doctrine (hyleg → alcocoden → anareta), after
 * Ptolemy (*Tetrabiblos* III), Lilly (*Christian Astrology* III), and Bonatti.
 *
 * IMPORTANT FRAMING: this is computed on the NATIVITY, and the death has already
 * occurred. We never predict. We surface how the classical technique reads the
 * birth chart and place the person's ACTUAL age beside the doctrine's indication,
 * as a contemplative comparison — the way a historian reads an old method against
 * a known outcome. Nothing here states or implies a cause of death.
 */
import type { DeathChart } from "../types";
import { almutenOfDegree, essentialDignityAt } from "./dignities";
import { computeLots } from "./lots";
import { PLANETARY_YEARS, type TradPlanet } from "./reference";

const APHETIC_HOUSES = new Set([1, 7, 9, 10, 11]);

function norm360(x: number): number {
  return ((x % 360) + 360) % 360;
}
function houseOf(lon: number, cusps: number[]): number | null {
  if (cusps.length < 13) return null;
  const l = norm360(lon);
  for (let h = 1; h <= 12; h++) {
    const s = norm360(cusps[h]);
    const span = norm360(norm360(cusps[h === 12 ? 1 : h + 1]) - s);
    if (span === 0 || norm360(l - s) < span) return h;
  }
  return null;
}

export interface HylegCandidate {
  name: string;
  longitude: number;
  house: number | null;
  aphetic: boolean;
}

export interface LifespanAnalysis {
  available: boolean;
  reason?: string;
  sect: "day" | "night";
  candidates: HylegCandidate[];
  hyleg: HylegCandidate | null;
  /** Almuten of the hyleg's degree — the giver of years */
  alcocoden: { planet: TradPlanet; house: number | null } | null;
  /** Which set of years the alcocoden's condition indicates */
  condition: "angular (greater)" | "succedent (mean)" | "cadent (lesser)" | null;
  indicatedYears: number | null;
  /** The full greater/mean/lesser table for the alcocoden, for transparency */
  yearRange: { greater: number; mean: number; lesser: number } | null;
  /** Candidate anaretic bodies (malefics afflicting the hyleg) — surfaced, not asserted */
  anaretaCandidates: string[];
  /** Actual age at death, for the honest side-by-side comparison */
  actualAgeYears: number | null;
}

function houseCategory(h: number | null): LifespanAnalysis["condition"] {
  if (h == null) return null;
  if (h === 1 || h === 4 || h === 7 || h === 10) return "angular (greater)";
  if (h === 2 || h === 5 || h === 8 || h === 11) return "succedent (mean)";
  return "cadent (lesser)";
}

export function computeLifespan(
  natal: DeathChart,
  birthISO: string,
  deathISO: string
): LifespanAnalysis {
  const sect = natal.sect;
  const base: LifespanAnalysis = {
    available: false,
    sect,
    candidates: [],
    hyleg: null,
    alcocoden: null,
    condition: null,
    indicatedYears: null,
    yearRange: null,
    anaretaCandidates: [],
    actualAgeYears: ageInYears(birthISO, deathISO),
  };

  if (natal.houseCusps.length < 13 || natal.ascendantLon == null) {
    return { ...base, reason: "The nativity has no birth time or place, so no aphetic house structure can be judged." };
  }

  const sun = natal.planets.find((p) => p.name === "Sun");
  const moon = natal.planets.find((p) => p.name === "Moon");
  const fortune = computeLots(natal).find((l) => l.name === "Part of Fortune");

  const candidates: HylegCandidate[] = [];
  const add = (name: string, lon: number | undefined | null) => {
    if (lon == null) return;
    const h = houseOf(lon, natal.houseCusps);
    candidates.push({ name, longitude: lon, house: h, aphetic: h != null && APHETIC_HOUSES.has(h) });
  };
  add("Sun", sun?.longitude);
  add("Moon", moon?.longitude);
  add("Ascendant", natal.ascendantLon);
  if (fortune) add("Part of Fortune", fortune.longitude);

  // Sect-ordered preference among aphetic candidates (Ptolemy/Lilly).
  const order = sect === "day"
    ? ["Sun", "Moon", "Ascendant", "Part of Fortune"]
    : ["Moon", "Sun", "Ascendant", "Part of Fortune"];
  let hyleg: HylegCandidate | null = null;
  for (const name of order) {
    const c = candidates.find((x) => x.name === name && x.aphetic);
    if (c) { hyleg = c; break; }
  }
  // Fallback: the sect light even if not aphetic (weak — noted by absence of aphetic flag).
  if (!hyleg) {
    hyleg = candidates.find((x) => x.name === (sect === "day" ? "Sun" : "Moon")) ?? candidates[0] ?? null;
  }
  if (!hyleg) {
    return { ...base, candidates, reason: "No hylegical candidate could be established." };
  }

  // Alcocoden = almuten of the hyleg's degree.
  const alm = almutenOfDegree(hyleg.longitude, sect);
  const alcPlanet = alm.planet;
  const alcPos = natal.planets.find((p) => p.name === alcPlanet);
  const alcHouse = alcPos ? houseOf(alcPos.longitude, natal.houseCusps) : null;
  const condition = houseCategory(alcHouse);
  const yearRange = PLANETARY_YEARS[alcPlanet];
  const indicatedYears = condition === "angular (greater)"
    ? yearRange.greater
    : condition === "cadent (lesser)"
      ? yearRange.lesser
      : yearRange.mean;

  // Anareta candidates: the malefics (Saturn, Mars), weighted if they aspect the
  // hyleg or dispose the 8th. Kept as surfaced testimony, never a mechanism.
  const anaretaCandidates: string[] = [];
  for (const mal of ["Saturn", "Mars"] as const) {
    const mp = natal.planets.find((p) => p.name === mal);
    if (!mp) continue;
    let d = Math.abs(norm360(mp.longitude) - norm360(hyleg.longitude));
    if (d > 180) d = 360 - d;
    const hard = [0, 90, 180].some((ang) => Math.abs(d - ang) <= 8);
    if (hard) anaretaCandidates.push(`${mal} (hard aspect to the hyleg)`);
    else {
      // Note its essential state anyway, as a background significator.
      const ed = essentialDignityAt(mal, mp.longitude, sect);
      if (ed.detriment || ed.fall) anaretaCandidates.push(`${mal} (afflicted in ${mp.sign})`);
    }
  }

  return {
    ...base,
    available: true,
    candidates,
    hyleg,
    alcocoden: { planet: alcPlanet, house: alcHouse },
    condition,
    indicatedYears,
    yearRange,
    anaretaCandidates,
  };
}

function ageInYears(birthISO: string, deathISO: string): number | null {
  const b = new Date(birthISO);
  const d = new Date(deathISO);
  if (isNaN(b.getTime()) || isNaN(d.getTime())) return null;
  let years = d.getUTCFullYear() - b.getUTCFullYear();
  const m = d.getUTCMonth() - b.getUTCMonth();
  if (m < 0 || (m === 0 && d.getUTCDate() < b.getUTCDate())) years--;
  return years >= 0 && years < 130 ? years : null;
}
