/**
 * Traditional astrology reference tables.
 *
 * These are hard-coded, source-verified constants (cross-checked against the
 * flatlib MIT implementation and the primary texts — Ptolemy *Tetrabiblos*,
 * William Lilly *Christian Astrology* 1647, Dorotheus, Al-Biruni). See
 * BUILD_PLAN.md §2 for provenance. The three places where sources genuinely
 * disagree (triplicity scheme, Fortune sect-reversal, Lot-of-Death formula) are
 * handled by exposing both variants, not by silently picking one.
 */

export const SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
] as const;
export type Sign = (typeof SIGNS)[number];

/** The seven traditional (visible) planets, in Chaldean/dignity order. */
export const TRADITIONAL_PLANETS = [
  "Saturn", "Jupiter", "Mars", "Sun", "Venus", "Mercury", "Moon",
] as const;
export type TradPlanet = (typeof TRADITIONAL_PLANETS)[number];

export const ELEMENTS: Record<Sign, "Fire" | "Earth" | "Air" | "Water"> = {
  Aries: "Fire", Leo: "Fire", Sagittarius: "Fire",
  Taurus: "Earth", Virgo: "Earth", Capricorn: "Earth",
  Gemini: "Air", Libra: "Air", Aquarius: "Air",
  Cancer: "Water", Scorpio: "Water", Pisces: "Water",
};

export const MODALITIES: Record<Sign, "Cardinal" | "Fixed" | "Mutable"> = {
  Aries: "Cardinal", Cancer: "Cardinal", Libra: "Cardinal", Capricorn: "Cardinal",
  Taurus: "Fixed", Leo: "Fixed", Scorpio: "Fixed", Aquarius: "Fixed",
  Gemini: "Mutable", Virgo: "Mutable", Sagittarius: "Mutable", Pisces: "Mutable",
};

/** Domicile (traditional rulers). */
export const RULERSHIP: Record<Sign, TradPlanet> = {
  Aries: "Mars", Taurus: "Venus", Gemini: "Mercury", Cancer: "Moon",
  Leo: "Sun", Virgo: "Mercury", Libra: "Venus", Scorpio: "Mars",
  Sagittarius: "Jupiter", Capricorn: "Saturn", Aquarius: "Saturn", Pisces: "Jupiter",
};

/** Detriment = ruler of the opposite sign. */
export const DETRIMENT: Record<Sign, TradPlanet> = {
  Aries: "Venus", Taurus: "Mars", Gemini: "Jupiter", Cancer: "Saturn",
  Leo: "Saturn", Virgo: "Jupiter", Libra: "Mars", Scorpio: "Venus",
  Sagittarius: "Mercury", Capricorn: "Moon", Aquarius: "Sun", Pisces: "Mercury",
};

/** Exaltation planet + exact degree within the sign. */
export const EXALTATION: Partial<Record<Sign, { planet: TradPlanet; degree: number }>> = {
  Aries: { planet: "Sun", degree: 19 },
  Taurus: { planet: "Moon", degree: 3 },
  Cancer: { planet: "Jupiter", degree: 15 },
  Virgo: { planet: "Mercury", degree: 15 },
  Libra: { planet: "Saturn", degree: 21 },
  Capricorn: { planet: "Mars", degree: 28 },
  Pisces: { planet: "Venus", degree: 27 },
};

/** Fall = the exalted planet, in the opposite sign. */
export const FALL: Partial<Record<Sign, { planet: TradPlanet; degree: number }>> = {
  Libra: { planet: "Sun", degree: 19 },
  Scorpio: { planet: "Moon", degree: 3 },
  Capricorn: { planet: "Jupiter", degree: 15 },
  Pisces: { planet: "Mercury", degree: 15 },
  Aries: { planet: "Saturn", degree: 21 },
  Cancer: { planet: "Mars", degree: 28 },
  Virgo: { planet: "Venus", degree: 27 },
};

/** Dorothean triplicity rulers (day / night / participating) — the default. */
export const TRIPLICITY_DOROTHEAN: Record<
  "Fire" | "Earth" | "Air" | "Water",
  { day: TradPlanet; night: TradPlanet; participating: TradPlanet }
> = {
  Fire: { day: "Sun", night: "Jupiter", participating: "Saturn" },
  Earth: { day: "Venus", night: "Moon", participating: "Mars" },
  Air: { day: "Saturn", night: "Mercury", participating: "Jupiter" },
  Water: { day: "Venus", night: "Mars", participating: "Moon" },
};

/** Egyptian terms/bounds: [start, end) within the sign. Verified vs flatlib. */
export const EGYPTIAN_TERMS: Record<Sign, { ruler: TradPlanet; start: number; end: number }[]> = {
  Aries: [
    { ruler: "Jupiter", start: 0, end: 6 }, { ruler: "Venus", start: 6, end: 12 },
    { ruler: "Mercury", start: 12, end: 20 }, { ruler: "Mars", start: 20, end: 25 },
    { ruler: "Saturn", start: 25, end: 30 },
  ],
  Taurus: [
    { ruler: "Venus", start: 0, end: 8 }, { ruler: "Mercury", start: 8, end: 14 },
    { ruler: "Jupiter", start: 14, end: 22 }, { ruler: "Saturn", start: 22, end: 27 },
    { ruler: "Mars", start: 27, end: 30 },
  ],
  Gemini: [
    { ruler: "Mercury", start: 0, end: 6 }, { ruler: "Jupiter", start: 6, end: 12 },
    { ruler: "Venus", start: 12, end: 17 }, { ruler: "Mars", start: 17, end: 24 },
    { ruler: "Saturn", start: 24, end: 30 },
  ],
  Cancer: [
    { ruler: "Mars", start: 0, end: 7 }, { ruler: "Venus", start: 7, end: 13 },
    { ruler: "Mercury", start: 13, end: 19 }, { ruler: "Jupiter", start: 19, end: 26 },
    { ruler: "Saturn", start: 26, end: 30 },
  ],
  Leo: [
    { ruler: "Jupiter", start: 0, end: 6 }, { ruler: "Venus", start: 6, end: 11 },
    { ruler: "Saturn", start: 11, end: 18 }, { ruler: "Mercury", start: 18, end: 24 },
    { ruler: "Mars", start: 24, end: 30 },
  ],
  Virgo: [
    { ruler: "Mercury", start: 0, end: 7 }, { ruler: "Venus", start: 7, end: 17 },
    { ruler: "Jupiter", start: 17, end: 21 }, { ruler: "Mars", start: 21, end: 28 },
    { ruler: "Saturn", start: 28, end: 30 },
  ],
  Libra: [
    { ruler: "Saturn", start: 0, end: 6 }, { ruler: "Mercury", start: 6, end: 14 },
    { ruler: "Jupiter", start: 14, end: 21 }, { ruler: "Venus", start: 21, end: 28 },
    { ruler: "Mars", start: 28, end: 30 },
  ],
  Scorpio: [
    { ruler: "Mars", start: 0, end: 7 }, { ruler: "Venus", start: 7, end: 11 },
    { ruler: "Mercury", start: 11, end: 19 }, { ruler: "Jupiter", start: 19, end: 24 },
    { ruler: "Saturn", start: 24, end: 30 },
  ],
  Sagittarius: [
    { ruler: "Jupiter", start: 0, end: 12 }, { ruler: "Venus", start: 12, end: 17 },
    { ruler: "Mercury", start: 17, end: 21 }, { ruler: "Saturn", start: 21, end: 26 },
    { ruler: "Mars", start: 26, end: 30 },
  ],
  Capricorn: [
    { ruler: "Mercury", start: 0, end: 7 }, { ruler: "Jupiter", start: 7, end: 14 },
    { ruler: "Venus", start: 14, end: 22 }, { ruler: "Saturn", start: 22, end: 26 },
    { ruler: "Mars", start: 26, end: 30 },
  ],
  Aquarius: [
    { ruler: "Mercury", start: 0, end: 7 }, { ruler: "Venus", start: 7, end: 13 },
    { ruler: "Jupiter", start: 13, end: 20 }, { ruler: "Mars", start: 20, end: 25 },
    { ruler: "Saturn", start: 25, end: 30 },
  ],
  Pisces: [
    { ruler: "Venus", start: 0, end: 12 }, { ruler: "Jupiter", start: 12, end: 16 },
    { ruler: "Mercury", start: 16, end: 19 }, { ruler: "Mars", start: 19, end: 28 },
    { ruler: "Saturn", start: 28, end: 30 },
  ],
};

/**
 * Chaldean-order faces/decans (10° each). Generated from the descending-speed
 * Chaldean sequence starting at Mars for 0° Aries.
 */
const CHALDEAN_ORDER: TradPlanet[] = ["Mars", "Sun", "Venus", "Mercury", "Moon", "Saturn", "Jupiter"];
export function faceRuler(signIndex: number, degreeInSign: number): TradPlanet {
  const faceIndex = signIndex * 3 + Math.floor(degreeInSign / 10); // 0..35
  return CHALDEAN_ORDER[faceIndex % 7];
}

/** Traditional planetary joys (planet → house of joy). */
export const JOYS: Partial<Record<TradPlanet, number>> = {
  Mercury: 1, Moon: 3, Venus: 5, Mars: 6, Sun: 9, Jupiter: 11, Saturn: 12,
};

/** Planetary years used by the length-of-life (alcocoden) doctrine. */
export const PLANETARY_YEARS: Record<TradPlanet, { greater: number; mean: number; lesser: number }> = {
  Saturn: { greater: 57, mean: 43.5, lesser: 30 },
  Jupiter: { greater: 79, mean: 45.5, lesser: 12 },
  Mars: { greater: 66, mean: 40.5, lesser: 15 },
  Sun: { greater: 120, mean: 69.5, lesser: 19 },
  Venus: { greater: 82, mean: 45, lesser: 8 },
  Mercury: { greater: 76, mean: 48, lesser: 20 },
  Moon: { greater: 108, mean: 66, lesser: 25 },
};

/**
 * Curated fixed stars a death specialist reads. Ecliptic longitudes are
 * ~J2000 tropical (from Robson / Ebertin / Brady); precession (+50.29″/yr) is
 * applied to the death year at read time. Positions computed live via Swiss
 * `swe_fixstar2` + `sefstars.txt` would be the higher-precision upgrade.
 */
export interface FixedStarRef {
  name: string;
  lonJ2000: number; // tropical ecliptic longitude at J2000
  magnitude: number;
  keywords: string;
  royal?: boolean;
}
export const FIXED_STARS: FixedStarRef[] = [
  { name: "Algol", lonJ2000: 56.17, magnitude: 2.1, keywords: "the Demon Star — violent or collective death, losing one's head, intensity" },
  { name: "Alcyone (Pleiades)", lonJ2000: 59.98, magnitude: 2.9, keywords: "the Weeping Sisters — mourning, sorrow, something to weep about" },
  { name: "Aldebaran", lonJ2000: 69.79, magnitude: 0.9, keywords: "Royal Watcher of the East — integrity then loss; honor with a price", royal: true },
  { name: "Betelgeuse", lonJ2000: 88.75, magnitude: 0.5, keywords: "martial honor; dramatic ends when afflicted" },
  { name: "Sirius", lonJ2000: 104.08, magnitude: -1.4, keywords: "the brilliant; fame and its shadow, the dog-days motif" },
  { name: "Praesepe (Aselli)", lonJ2000: 127.2, magnitude: 3.7, keywords: "clouded sight, fevers, an obscured or clouded passing" },
  { name: "Regulus", lonJ2000: 149.83, magnitude: 1.4, keywords: "Royal Watcher of the North — rise then downfall, ruin from success", royal: true },
  { name: "Vindemiatrix", lonJ2000: 189.93, magnitude: 2.8, keywords: "the Widow-maker — bereavement, loss of a partner" },
  { name: "Spica", lonJ2000: 203.83, magnitude: 1.0, keywords: "benefic protection, a grace amid difficulty" },
  { name: "Antares", lonJ2000: 249.77, magnitude: 1.1, keywords: "Royal Watcher of the West — obsession, intensity, self-consuming fire", royal: true },
  { name: "Facies", lonJ2000: 278.0, magnitude: 5.1, keywords: "the piercing gaze — a sharp, ruthless, or sudden ending" },
  { name: "Scheat", lonJ2000: 329.37, magnitude: 2.4, keywords: "extreme misfortune, water and drowning, catastrophe" },
  { name: "Fomalhaut", lonJ2000: 333.87, magnitude: 1.2, keywords: "Royal Watcher of the South — fated fame or fated fall; the mystical", royal: true },
  { name: "Capulus", lonJ2000: 54.0, magnitude: 4.3, keywords: "penetrating force, ruthlessness, blindness" },
];

export function signIndex(sign: string): number {
  return SIGNS.indexOf(sign as Sign);
}
export function signFromIndex(i: number): Sign {
  return SIGNS[((i % 12) + 12) % 12];
}
