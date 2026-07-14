/**
 * Cross-aspects between the nativity and the death moment — in effect, the
 * transits standing over the birth chart at the crossing. A specialist reads
 * these as the "return" of the sky to the natal promise. We report contacts of
 * the death-moment bodies to the natal bodies and angles within tight orbs.
 */
import type { DeathChart } from "../types";

const ASPECTS: { name: string; angle: number; orb: number; hard: boolean }[] = [
  { name: "Conjunction", angle: 0, orb: 3, hard: true },
  { name: "Opposition", angle: 180, orb: 3, hard: true },
  { name: "Square", angle: 90, orb: 2.5, hard: true },
  { name: "Trine", angle: 120, orb: 2.5, hard: false },
  { name: "Sextile", angle: 60, orb: 2, hard: false },
];

// The slow, karmic bodies carry the most weight as "returning" significators.
const OUTER = new Set(["Saturn", "Uranus", "Neptune", "Pluto", "North Node", "South Node"]);

function norm360(x: number): number {
  return ((x % 360) + 360) % 360;
}
function sep(a: number, b: number): number {
  const d = Math.abs(norm360(a) - norm360(b)) % 360;
  return d > 180 ? 360 - d : d;
}

export interface CrossAspect {
  /** Body in the death chart */
  transit: string;
  /** Natal body or angle it contacts */
  natal: string;
  aspect: string;
  orb: number;
  hard: boolean;
  /** True when the transiting body is a slow/karmic significator */
  weighty: boolean;
}

export function computeCrossAspects(natal: DeathChart, death: DeathChart): CrossAspect[] {
  const natalTargets: { name: string; lon: number }[] = natal.planets.map((p) => ({ name: p.name, lon: p.longitude }));
  if (natal.ascendantLon != null) natalTargets.push({ name: "Ascendant", lon: natal.ascendantLon });
  if (natal.midheavenLon != null) natalTargets.push({ name: "Midheaven", lon: natal.midheavenLon });

  const out: CrossAspect[] = [];
  for (const t of death.planets) {
    for (const n of natalTargets) {
      const s = sep(t.longitude, n.lon);
      for (const asp of ASPECTS) {
        const orb = Math.abs(s - asp.angle);
        if (orb <= asp.orb) {
          out.push({
            transit: t.name,
            natal: n.name,
            aspect: asp.name,
            orb: Number(orb.toFixed(2)),
            hard: asp.hard,
            weighty: OUTER.has(t.name),
          });
          break;
        }
      }
    }
  }
  // Weighty and tight first.
  return out.sort((a, b) => Number(b.weighty) - Number(a.weighty) || a.orb - b.orb);
}
