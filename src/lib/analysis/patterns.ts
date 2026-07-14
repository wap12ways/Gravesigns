/**
 * Multi-planet aspect patterns and Marc Edmund Jones chart shapes, detected
 * geometrically from the planet longitudes. (Robert Hand, *Horoscope Symbols*;
 * Jones, *The Guide to Horoscope Interpretation*.)
 */
import type { DeathChart, PlanetPosition } from "../types";

const PATTERN_ORB = 6;

function norm360(x: number): number {
  return ((x % 360) + 360) % 360;
}
function sep(a: number, b: number): number {
  const d = Math.abs(norm360(a) - norm360(b)) % 360;
  return d > 180 ? 360 - d : d;
}
/** True when a and b are within orb of the given aspect angle. */
function has(a: PlanetPosition, b: PlanetPosition, angle: number, orb = PATTERN_ORB): boolean {
  return Math.abs(sep(a.longitude, b.longitude) - angle) <= orb;
}

export interface AspectPattern {
  type: string;
  members: string[];
  description: string;
}

export function detectPatterns(chart: DeathChart): AspectPattern[] {
  const P = chart.planets;
  const out: AspectPattern[] = [];
  const seen = new Set<string>();
  const key = (type: string, names: string[]) => `${type}:${[...names].sort().join(",")}`;
  const push = (type: string, members: string[], description: string) => {
    const k = key(type, members);
    if (seen.has(k)) return;
    seen.add(k);
    out.push({ type, members, description });
  };

  // Stellium: 3+ planets in the same sign.
  const bySign: Record<string, string[]> = {};
  for (const p of P) (bySign[p.sign] ||= []).push(p.name);
  for (const [sign, names] of Object.entries(bySign)) {
    if (names.length >= 3) push("Stellium", names, `A concentration of ${names.length} bodies in ${sign}.`);
  }

  for (let i = 0; i < P.length; i++) {
    for (let j = i + 1; j < P.length; j++) {
      // T-Square: opposition + a third squaring both (apex).
      if (has(P[i], P[j], 180)) {
        for (let k = 0; k < P.length; k++) {
          if (k === i || k === j) continue;
          if (has(P[k], P[i], 90) && has(P[k], P[j], 90)) {
            push("T-Square", [P[i].name, P[j].name, P[k].name], `Opposition of ${P[i].name} and ${P[j].name} focused on ${P[k].name} at the apex.`);
          }
        }
      }
      // Grand Trine: three mutually trine.
      if (has(P[i], P[j], 120)) {
        for (let k = j + 1; k < P.length; k++) {
          if (has(P[k], P[i], 120) && has(P[k], P[j], 120)) {
            push("Grand Trine", [P[i].name, P[j].name, P[k].name], `A closed triangle of ease between ${P[i].name}, ${P[j].name}, and ${P[k].name}.`);
          }
        }
      }
      // Yod: sextile pair both quincunx a third apex.
      if (has(P[i], P[j], 60)) {
        for (let k = 0; k < P.length; k++) {
          if (k === i || k === j) continue;
          if (has(P[k], P[i], 150) && has(P[k], P[j], 150)) {
            push("Yod", [P[i].name, P[j].name, P[k].name], `A "finger of fate" pointing to ${P[k].name}.`);
          }
        }
      }
    }
  }

  return out;
}

export interface ChartShape {
  shape: string;
  description: string;
}

/** Marc Edmund Jones chart shape from the distribution of planet longitudes. */
export function chartShape(chart: DeathChart): ChartShape {
  const lons = chart.planets.map((p) => norm360(p.longitude)).sort((a, b) => a - b);
  const n = lons.length;
  if (n < 3) return { shape: "Indeterminate", description: "Too few bodies to judge shape." };

  const gaps: number[] = [];
  for (let i = 0; i < n; i++) {
    gaps.push(norm360((i === n - 1 ? lons[0] + 360 : lons[i + 1]) - lons[i]));
  }
  const maxGap = Math.max(...gaps);
  const occupied = 360 - maxGap;
  const sorted = [...gaps].sort((a, b) => b - a);
  const secondGap = sorted[1] ?? 0;

  let shape: string, description: string;
  if (occupied <= 120) {
    shape = "Bundle";
    description = "All bodies gathered within a trine — a concentrated, self-contained life-signature.";
  } else if (maxGap >= 180) {
    // Bowl, or Bucket if a lone planet sits opposite the bowl.
    shape = "Bowl";
    description = "All bodies within one hemisphere — a chart with a clear leading and trailing edge.";
  } else if (maxGap >= 110 && secondGap < 70) {
    shape = "Locomotive";
    description = "Bodies filling two-thirds of the wheel with one empty trine — driven, with momentum.";
  } else if (sorted[0] >= 60 && sorted[1] >= 60) {
    shape = "Seesaw";
    description = "Two opposing groups — a life held between two poles.";
  } else if (maxGap < 60) {
    shape = "Splash";
    description = "Bodies spread widely around the wheel — diffuse, many-sided.";
  } else {
    shape = "Splay";
    description = "An irregular, individual distribution that resists a single pattern.";
  }
  return { shape, description };
}
