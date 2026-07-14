/**
 * Arabic Lots / Parts. Part of Fortune uses the sect-reversed (Paulus) form.
 * The Lot of Death is computed in BOTH traditional lineages — the Ascendant
 * form (Paulus) and the Saturn form (Dorotheus/Bonatti) — since the sources
 * genuinely disagree; the reading cites which it leans on.
 */
import type { DeathChart } from "../types";
import { RULERSHIP, signFromIndex } from "./reference";

function norm360(x: number): number {
  return ((x % 360) + 360) % 360;
}
function houseOf(lon: number, cusps: number[]): number | null {
  if (cusps.length < 13) return null;
  const l = norm360(lon);
  for (let hh = 1; hh <= 12; hh++) {
    const s = norm360(cusps[hh]);
    const e = norm360(cusps[hh === 12 ? 1 : hh + 1]);
    const span = norm360(e - s);
    const off = norm360(l - s);
    if (span === 0 || off < span) return hh;
  }
  return null;
}

export interface Lot {
  name: string;
  longitude: number;
  sign: string;
  degreeInSign: number;
  house: number | null;
  ruler: string;
  formula: string;
  source: string;
}

function makeLot(
  name: string,
  lon: number,
  chart: DeathChart,
  formula: string,
  source: string
): Lot {
  const l = norm360(lon);
  const signIdx = Math.floor(l / 30) % 12;
  const sign = signFromIndex(signIdx);
  return {
    name,
    longitude: l,
    sign,
    degreeInSign: l % 30,
    house: houseOf(l, chart.houseCusps),
    ruler: RULERSHIP[sign],
    formula,
    source,
  };
}

export function computeLots(chart: DeathChart): Lot[] {
  const lots: Lot[] = [];
  const asc = chart.ascendantLon;
  const cusp8 = chart.houseCusps.length >= 13 ? chart.houseCusps[8] : null;
  const sun = chart.planets.find((p) => p.name === "Sun");
  const moon = chart.planets.find((p) => p.name === "Moon");
  const saturn = chart.planets.find((p) => p.name === "Saturn");
  if (!sun || !moon) return lots;
  const day = chart.sect === "day";

  // Part of Fortune (sect-reversed) — needs the Ascendant.
  if (asc != null) {
    const fortune = day
      ? asc + moon.longitude - sun.longitude
      : asc + sun.longitude - moon.longitude;
    lots.push(
      makeLot(
        "Part of Fortune",
        fortune,
        chart,
        day ? "Asc + Moon − Sun (day)" : "Asc + Sun − Moon (night)",
        "Paulus Alexandrinus (sect-reversed)"
      )
    );
  }

  // Lot of Death — Ascendant form (Paulus): Asc + 8th cusp − Moon.
  if (asc != null && cusp8 != null) {
    lots.push(
      makeLot(
        "Lot of Death (Ascendant form)",
        asc + cusp8 - moon.longitude,
        chart,
        "Asc + cusp₈ − Moon",
        "Paulus Alexandrinus / Olympiodorus"
      )
    );
  }

  // Lot of Death — Saturn form (Dorotheus/Bonatti): Saturn + 8th cusp − Moon.
  if (saturn && cusp8 != null) {
    lots.push(
      makeLot(
        "Lot of Death (Saturn form)",
        saturn.longitude + cusp8 - moon.longitude,
        chart,
        "Saturn + cusp₈ − Moon",
        "Dorotheus / Abu Ma'shar / Bonatti"
      )
    );
  }

  return lots;
}
