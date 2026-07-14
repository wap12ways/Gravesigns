/**
 * A curated catalogue of bright stars (J2000 equatorial coordinates) for the
 * sky-dome map — the brightest ~50 stars, enough for a recognisable sky. RA and
 * Dec are in degrees; magnitude is visual. Several (Aldebaran, Antares, Regulus,
 * Algol, Spica, Sirius) also appear in the fixed-star death list, which ties the
 * map to the reading. Precession over decades is < 1° and is neglected here.
 */
export interface Star {
  name: string;
  ra: number; // degrees, J2000
  dec: number; // degrees, J2000
  mag: number;
  label?: boolean; // worth naming on the map
}

export const BRIGHT_STARS: Star[] = [
  { name: "Sirius", ra: 101.287, dec: -16.716, mag: -1.46, label: true },
  { name: "Canopus", ra: 95.988, dec: -52.696, mag: -0.74 },
  { name: "Arcturus", ra: 213.915, dec: 19.182, mag: -0.05, label: true },
  { name: "Rigil Kentaurus", ra: 219.902, dec: -60.834, mag: -0.27 },
  { name: "Vega", ra: 279.234, dec: 38.784, mag: 0.03, label: true },
  { name: "Capella", ra: 79.172, dec: 45.998, mag: 0.08, label: true },
  { name: "Rigel", ra: 78.634, dec: -8.202, mag: 0.13, label: true },
  { name: "Procyon", ra: 114.825, dec: 5.225, mag: 0.34, label: true },
  { name: "Betelgeuse", ra: 88.793, dec: 7.407, mag: 0.5, label: true },
  { name: "Achernar", ra: 24.429, dec: -57.237, mag: 0.46 },
  { name: "Hadar", ra: 210.956, dec: -60.373, mag: 0.61 },
  { name: "Altair", ra: 297.696, dec: 8.868, mag: 0.77, label: true },
  { name: "Acrux", ra: 186.65, dec: -63.099, mag: 0.77 },
  { name: "Aldebaran", ra: 68.98, dec: 16.509, mag: 0.85, label: true },
  { name: "Antares", ra: 247.352, dec: -26.432, mag: 1.09, label: true },
  { name: "Spica", ra: 201.298, dec: -11.161, mag: 0.97, label: true },
  { name: "Pollux", ra: 116.329, dec: 28.026, mag: 1.14, label: true },
  { name: "Fomalhaut", ra: 344.413, dec: -29.622, mag: 1.16, label: true },
  { name: "Deneb", ra: 310.358, dec: 45.28, mag: 1.25, label: true },
  { name: "Regulus", ra: 152.093, dec: 11.967, mag: 1.35, label: true },
  { name: "Adhara", ra: 104.656, dec: -28.972, mag: 1.5 },
  { name: "Castor", ra: 113.65, dec: 31.888, mag: 1.58 },
  { name: "Gacrux", ra: 187.791, dec: -57.113, mag: 1.63 },
  { name: "Bellatrix", ra: 81.283, dec: 6.35, mag: 1.64 },
  { name: "Elnath", ra: 81.573, dec: 28.608, mag: 1.65 },
  { name: "Alnilam", ra: 84.053, dec: -1.202, mag: 1.69 },
  { name: "Alnitak", ra: 85.19, dec: -1.943, mag: 1.77 },
  { name: "Alioth", ra: 193.507, dec: 55.96, mag: 1.76 },
  { name: "Dubhe", ra: 165.932, dec: 61.751, mag: 1.79 },
  { name: "Mirfak", ra: 51.081, dec: 49.861, mag: 1.79 },
  { name: "Polaris", ra: 37.954, dec: 89.264, mag: 1.98, label: true },
  { name: "Kaus Australis", ra: 276.043, dec: -34.385, mag: 1.85 },
  { name: "Wezen", ra: 107.098, dec: -26.393, mag: 1.83 },
  { name: "Alkaid", ra: 206.885, dec: 49.313, mag: 1.85 },
  { name: "Menkalinan", ra: 89.882, dec: 44.947, mag: 1.9 },
  { name: "Alhena", ra: 99.428, dec: 16.399, mag: 1.93 },
  { name: "Mirzam", ra: 95.675, dec: -17.956, mag: 1.98 },
  { name: "Alphard", ra: 141.897, dec: -8.659, mag: 1.98 },
  { name: "Algol", ra: 47.042, dec: 40.956, mag: 2.12, label: true },
  { name: "Hamal", ra: 31.793, dec: 23.462, mag: 2.0 },
  { name: "Nunki", ra: 283.816, dec: -26.297, mag: 2.05 },
  { name: "Alpheratz", ra: 2.097, dec: 29.09, mag: 2.06 },
  { name: "Mirach", ra: 17.433, dec: 35.621, mag: 2.06 },
  { name: "Rasalhague", ra: 263.734, dec: 12.56, mag: 2.08 },
  { name: "Denebola", ra: 177.265, dec: 14.572, mag: 2.11 },
  { name: "Kochab", ra: 222.676, dec: 74.156, mag: 2.08 },
  { name: "Diphda", ra: 10.897, dec: -17.987, mag: 2.04 },
  { name: "Menkent", ra: 211.671, dec: -36.37, mag: 2.06 },
  { name: "Alnair", ra: 332.058, dec: -46.961, mag: 1.74 },
  { name: "Peacock", ra: 306.412, dec: -56.735, mag: 1.94 },
];
