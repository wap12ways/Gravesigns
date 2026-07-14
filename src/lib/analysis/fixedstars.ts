/**
 * Fixed-star contacts. The curated J2000 tropical longitudes in reference.ts are
 * precessed to the death year (+50.29″/yr ≈ +0.013969°/yr) and conjunctions to
 * planets and the chart angles are reported within a tight orb. Only conjunction
 * is used — the tradition reads fixed stars almost exclusively by conjunction
 * (and, for the brightest, parallel of declination, which we do not yet compute).
 */
import type { DeathChart } from "../types";
import { FIXED_STARS, type FixedStarRef } from "./reference";

const PRECESSION_PER_YEAR = 50.29 / 3600; // degrees/year
/** Orb by magnitude: the brighter the star, the wider it is read. */
function orbFor(star: FixedStarRef): number {
  if (star.royal || star.magnitude <= 1.0) return 1.5;
  if (star.magnitude <= 2.5) return 1.0;
  return 0.5;
}

function norm360(x: number): number {
  return ((x % 360) + 360) % 360;
}
function sep(a: number, b: number): number {
  const d = Math.abs(norm360(a) - norm360(b)) % 360;
  return d > 180 ? 360 - d : d;
}

export interface FixedStarContact {
  star: string;
  /** The body or angle the star conjoins */
  body: string;
  /** Precessed tropical longitude of the star at the death year */
  starLon: number;
  orb: number;
  magnitude: number;
  keywords: string;
  royal: boolean;
}

/** Precess the catalog to the given calendar year and return its longitudes. */
export function precessedStars(year: number): (FixedStarRef & { lon: number })[] {
  const dt = year - 2000;
  return FIXED_STARS.map((s) => ({ ...s, lon: norm360(s.lonJ2000 + PRECESSION_PER_YEAR * dt) }));
}

export function detectFixedStarContacts(chart: DeathChart): FixedStarContact[] {
  const year = new Date(chart.timestampUtc).getUTCFullYear();
  const stars = precessedStars(year);
  const out: FixedStarContact[] = [];

  // Everything a star can sit on: the bodies, plus the two angles when known.
  const targets: { name: string; lon: number }[] = chart.planets.map((p) => ({
    name: p.name,
    lon: p.longitude,
  }));
  if (chart.ascendantLon != null) targets.push({ name: "Ascendant", lon: chart.ascendantLon });
  if (chart.midheavenLon != null) targets.push({ name: "Midheaven", lon: chart.midheavenLon });

  for (const star of stars) {
    const orb = orbFor(star);
    for (const t of targets) {
      const d = sep(star.lon, t.lon);
      if (d <= orb) {
        out.push({
          star: star.name,
          body: t.name,
          starLon: star.lon,
          orb: Number(d.toFixed(2)),
          magnitude: star.magnitude,
          keywords: star.keywords,
          royal: star.royal ?? false,
        });
      }
    }
  }

  // Tightest contacts first — those carry the most weight.
  return out.sort((a, b) => a.orb - b.orb);
}
