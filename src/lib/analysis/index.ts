/**
 * Step-0 deterministic analysis engine.
 *
 * Turns the raw DeathChart (positions, houses, aspects) into the full body of
 * traditional testimony a professional would tabulate BEFORE interpreting:
 * dignities, lots, patterns and chart shape, fixed-star contacts, and the
 * death-specific house/significator complex. Contains no AI and no ephemeris
 * calls — it is pure, cheap, and reproducible, and it is the single source of
 * truth handed to the AI judgment pass and to the front-end visuals.
 */
import type { DeathChart } from "../types";
import { computeDignities, almutenOfDegree, type PlanetDignity } from "./dignities";
import { computeLots, type Lot } from "./lots";
import { detectPatterns, chartShape, type AspectPattern, type ChartShape } from "./patterns";
import { detectFixedStarContacts, type FixedStarContact } from "./fixedstars";
import { computeDeathFactors, type DeathFactors } from "./deathfactors";
import { SIGNS, MODALITIES, ELEMENTS } from "./reference";

export interface ChartAnalysis {
  /** Schema version, so persisted analyses can be migrated later */
  version: number;
  sect: "day" | "night";
  dignities: PlanetDignity[];
  /** Almuten of the Ascendant degree — the chart's "ruler of the geniture" seed */
  ascendantAlmuten: { planet: string; score: number } | null;
  lots: Lot[];
  patterns: AspectPattern[];
  shape: ChartShape;
  fixedStars: FixedStarContact[];
  death: DeathFactors;
  /** Element / modality tallies across all bodies, for the elemental balance */
  balance: {
    elements: Record<string, number>;
    modalities: Record<string, number>;
  };
}

export const ANALYSIS_VERSION = 1;

function computeBalance(chart: DeathChart) {
  const elements: Record<string, number> = { Fire: 0, Earth: 0, Air: 0, Water: 0 };
  const modalities: Record<string, number> = { Cardinal: 0, Fixed: 0, Mutable: 0 };
  for (const p of chart.planets) {
    const sign = p.sign as (typeof SIGNS)[number];
    if (ELEMENTS[sign]) elements[ELEMENTS[sign]] += 1;
    if (MODALITIES[sign]) modalities[MODALITIES[sign]] += 1;
  }
  return { elements, modalities };
}

export function computeChartAnalysis(chart: DeathChart): ChartAnalysis {
  const ascendantAlmuten =
    chart.ascendantLon != null
      ? (() => {
          const a = almutenOfDegree(chart.ascendantLon!, chart.sect);
          return { planet: a.planet, score: a.score };
        })()
      : null;

  return {
    version: ANALYSIS_VERSION,
    sect: chart.sect,
    dignities: computeDignities(chart),
    ascendantAlmuten,
    lots: computeLots(chart),
    patterns: detectPatterns(chart),
    shape: chartShape(chart),
    fixedStars: detectFixedStarContacts(chart),
    death: computeDeathFactors(chart),
    balance: computeBalance(chart),
  };
}

export type {
  PlanetDignity,
  Lot,
  AspectPattern,
  ChartShape,
  FixedStarContact,
  DeathFactors,
};
