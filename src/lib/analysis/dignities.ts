/**
 * Essential and accidental dignity scoring (Lilly's point system, Christian
 * Astrology 1647 pp. 104–115), plus almuten-of-a-degree. Cross-checked against
 * flatlib. Operates on the deterministic chart — no AI, no ephemeris calls.
 */
import type { DeathChart, PlanetPosition } from "../types";
import {
  RULERSHIP, DETRIMENT, EXALTATION, FALL, TRIPLICITY_DOROTHEAN,
  EGYPTIAN_TERMS, faceRuler, JOYS, ELEMENTS, TRADITIONAL_PLANETS,
  signFromIndex, type Sign, type TradPlanet,
} from "./reference";

function norm360(x: number): number {
  return ((x % 360) + 360) % 360;
}
function placeOf(lon: number): { sign: Sign; signIdx: number; deg: number } {
  const l = norm360(lon);
  const signIdx = Math.floor(l / 30) % 12;
  return { sign: signFromIndex(signIdx), signIdx, deg: l % 30 };
}
function isTrad(name: string): name is TradPlanet {
  return (TRADITIONAL_PLANETS as readonly string[]).includes(name);
}

export interface EssentialDignity {
  domicile: boolean;
  exaltation: boolean;
  triplicity: boolean;
  term: boolean;
  face: boolean;
  detriment: boolean;
  fall: boolean;
  peregrine: boolean;
  score: number;
  breakdown: string[];
}

/** Essential dignity of a planet at an ecliptic longitude, given chart sect. */
export function essentialDignityAt(
  planet: TradPlanet,
  lon: number,
  sect: "day" | "night"
): EssentialDignity {
  const { sign, signIdx, deg } = placeOf(lon);
  const breakdown: string[] = [];
  let score = 0;

  const domicile = RULERSHIP[sign] === planet;
  if (domicile) { score += 5; breakdown.push("domicile +5"); }

  const ex = EXALTATION[sign];
  const exaltation = ex?.planet === planet;
  if (exaltation) { score += 4; breakdown.push("exaltation +4"); }

  const tri = TRIPLICITY_DOROTHEAN[ELEMENTS[sign]];
  const triRuler = sect === "day" ? tri.day : tri.night;
  const triplicity = triRuler === planet;
  if (triplicity) { score += 3; breakdown.push("triplicity +3"); }

  const term = EGYPTIAN_TERMS[sign].find((t) => deg >= t.start && deg < t.end)?.ruler === planet;
  if (term) { score += 2; breakdown.push("term +2"); }

  const face = faceRuler(signIdx, deg) === planet;
  if (face) { score += 1; breakdown.push("face +1"); }

  const detriment = DETRIMENT[sign] === planet;
  if (detriment) { score -= 5; breakdown.push("detriment −5"); }

  const fl = FALL[sign];
  const fall = fl?.planet === planet;
  if (fall) { score -= 4; breakdown.push("fall −4"); }

  // Peregrine: in none of its five essential dignities — but a planet already in
  // its detriment or fall is not additionally termed peregrine (Lilly, CA p.115).
  const peregrine =
    !(domicile || exaltation || triplicity || term || face) && !(detriment || fall);
  if (peregrine) { score -= 5; breakdown.push("peregrine −5"); }

  return { domicile, exaltation, triplicity, term, face, detriment, fall, peregrine, score, breakdown };
}

/** Almuten of a degree: the planet with the most (positive) dignity there. */
export function almutenOfDegree(
  lon: number,
  sect: "day" | "night"
): { planet: TradPlanet; score: number; scores: Record<string, number> } {
  const { sign, signIdx, deg } = placeOf(lon);
  const scores: Record<string, number> = {};
  for (const p of TRADITIONAL_PLANETS) scores[p] = 0;
  scores[RULERSHIP[sign]] += 5;
  const ex = EXALTATION[sign];
  if (ex) scores[ex.planet] += 4;
  const tri = TRIPLICITY_DOROTHEAN[ELEMENTS[sign]];
  scores[sect === "day" ? tri.day : tri.night] += 3;
  const term = EGYPTIAN_TERMS[sign].find((t) => deg >= t.start && deg < t.end);
  if (term) scores[term.ruler] += 2;
  scores[faceRuler(signIdx, deg)] += 1;

  let best: TradPlanet = "Sun";
  let bestScore = -1;
  for (const p of TRADITIONAL_PLANETS) {
    if (scores[p] > bestScore) { bestScore = scores[p]; best = p; }
  }
  return { planet: best, score: bestScore, scores };
}

const MEAN_MOTION: Record<TradPlanet, number> = {
  Moon: 13.176, Mercury: 1.383, Venus: 1.2, Sun: 0.985,
  Mars: 0.524, Jupiter: 0.083, Saturn: 0.034,
};
const SUPERIOR = new Set<TradPlanet>(["Saturn", "Jupiter", "Mars"]);
const INFERIOR = new Set<TradPlanet>(["Mercury", "Venus"]);

export interface AccidentalDignity {
  score: number;
  factors: { name: string; points: number }[];
}

export function accidentalDignity(pos: PlanetPosition, chart: DeathChart): AccidentalDignity {
  const factors: { name: string; points: number }[] = [];
  const add = (name: string, points: number) => { factors.push({ name, points }); };
  const planet = pos.name as TradPlanet;

  // House placement
  const h = pos.house;
  if (h != null) {
    if (h === 1 || h === 10) add("angular (1st/10th)", 5);
    else if (h === 7 || h === 4 || h === 11) add(`house ${h}`, 4);
    else if (h === 2 || h === 5) add(`house ${h}`, 3);
    else if (h === 9) add("house 9", 2);
    else if (h === 3) add("house 3", 1);
    else if (h === 12) add("house 12", -5);
    else if (h === 6 || h === 8) add(`house ${h}`, -2);
  }

  // Retrograde / speed (Sun & Moon never retrograde)
  if (planet !== "Sun" && planet !== "Moon") {
    if (pos.retrograde) add("retrograde", -5);
    const mean = MEAN_MOTION[planet];
    if (mean) add(Math.abs(pos.speed) > mean ? "swift" : "slow", Math.abs(pos.speed) > mean ? 2 : -2);
  }

  // Relation to the Sun (combustion / cazimi / under beams; oriental/occidental)
  const sun = chart.planets.find((p) => p.name === "Sun");
  if (sun && planet !== "Sun") {
    let d = Math.abs(norm360(pos.longitude) - norm360(sun.longitude));
    if (d > 180) d = 360 - d;
    if (d <= 0.283) add("cazimi", 5); // 0°17'
    else if (d <= 8.5) add("combust", -5);
    else if (d <= 17) add("under the Sun's beams", -4);

    if (planet !== "Moon") {
      const delta = norm360(pos.longitude - sun.longitude);
      const oriental = delta > 180; // rises before the Sun
      if (SUPERIOR.has(planet)) add(oriental ? "oriental" : "occidental", oriental ? 2 : -2);
      else if (INFERIOR.has(planet)) add(oriental ? "oriental" : "occidental", oriental ? -2 : 2);
    }
  }

  // Moon waxing/waning
  if (planet === "Moon" && sun) {
    const delta = norm360(pos.longitude - sun.longitude);
    add(delta < 180 ? "waxing (increasing light)" : "waning (decreasing light)", delta < 180 ? 2 : -2);
  }

  // Joy
  if (h != null && JOYS[planet] === h) add(`in joy (house ${h})`, 1);

  return { score: factors.reduce((s, f) => s + f.points, 0), factors };
}

export interface PlanetDignity {
  planet: TradPlanet;
  sign: string;
  essential: EssentialDignity;
  accidental: AccidentalDignity;
  total: number;
}

/** Full dignity readout for the seven traditional planets present in the chart. */
export function computeDignities(chart: DeathChart): PlanetDignity[] {
  return chart.planets
    .filter((p) => isTrad(p.name))
    .map((p) => {
      const essential = essentialDignityAt(p.name as TradPlanet, p.longitude, chart.sect);
      const accidental = accidentalDignity(p, chart);
      return {
        planet: p.name as TradPlanet,
        sign: p.sign,
        essential,
        accidental,
        total: essential.score + accidental.score,
      };
    });
}
