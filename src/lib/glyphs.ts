/** Shared astrological glyphs and element colours for the chart visuals. */

// U+FE0E (VS15) forces text (monochrome line) presentation so the zodiac and
// planet glyphs never render as coloured emoji badges — we want elegant hairline
// symbols we can tint ourselves.
const T = "︎";

export const PLANET_GLYPH: Record<string, string> = {
  Sun: "☉" + T, Moon: "☽" + T, Mercury: "☿" + T, Venus: "♀" + T, Mars: "♂" + T,
  Jupiter: "♃" + T, Saturn: "♄" + T, Uranus: "♅" + T, Neptune: "♆" + T, Pluto: "♇" + T,
  "North Node": "☊" + T, "South Node": "☋" + T, Chiron: "⚷" + T,
};

export const SIGN_GLYPH: Record<string, string> = {
  Aries: "♈" + T, Taurus: "♉" + T, Gemini: "♊" + T, Cancer: "♋" + T, Leo: "♌" + T, Virgo: "♍" + T,
  Libra: "♎" + T, Scorpio: "♏" + T, Sagittarius: "♐" + T, Capricorn: "♑" + T, Aquarius: "♒" + T, Pisces: "♓" + T,
};

export const SIGN_ELEMENT: Record<string, "Fire" | "Earth" | "Air" | "Water"> = {
  Aries: "Fire", Leo: "Fire", Sagittarius: "Fire",
  Taurus: "Earth", Virgo: "Earth", Capricorn: "Earth",
  Gemini: "Air", Libra: "Air", Aquarius: "Air",
  Cancer: "Water", Scorpio: "Water", Pisces: "Water",
};

/** Muted, funereal-luxe element palette that reads against the indigo ground. */
export const ELEMENT_COLOR: Record<string, string> = {
  Fire: "#d98a6a", // ember
  Earth: "#9fae7a", // moss-gold
  Air: "#a9b6d6", // pale sky
  Water: "#7fa8c0", // deep water
};

export const ASPECT_COLOR: Record<string, string> = {
  Conjunction: "#e9c46a",
  Opposition: "#c76d6d",
  Square: "#c76d6d",
  Trine: "#6fae8f",
  Sextile: "#6fae8f",
  Quincunx: "#8a83a6",
  Semisextile: "#8a83a6",
};

/** Hard aspects are drawn solid; soft/minor dashed. */
export const ASPECT_HARD = new Set(["Conjunction", "Opposition", "Square"]);

export const SIGNS_ORDER = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

export function fmtDeg(deg: number): string {
  const d = Math.floor(deg);
  const m = Math.round((deg - d) * 60);
  return m === 60 ? `${d + 1}°00′` : `${d}°${String(m).padStart(2, "0")}′`;
}
