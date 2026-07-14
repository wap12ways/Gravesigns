/**
 * A small, self-contained spherical-astronomy pipeline (after Meeus,
 * *Astronomical Algorithms*) to place bodies and stars on the local sky dome at
 * a given instant and location. Everything is deterministic and pure.
 *
 * Note: planets are converted from tropical ecliptic longitude assuming ecliptic
 * latitude ≈ 0 (we store longitude only), which is accurate to a degree or so for
 * a horizon map — plenty for showing what stood where at the crossing.
 */

const DEG = Math.PI / 180;
const OBLIQUITY = 23.4393; // mean obliquity, deg (adequate for a horizon map)

export function julianDay(iso: string): number {
  return new Date(iso).getTime() / 86400000 + 2440587.5;
}

/** Greenwich mean sidereal time in degrees. */
export function gmstDeg(jd: number): number {
  const d = jd - 2451545.0;
  return norm360(280.46061837 + 360.98564736629 * d);
}

/** Local sidereal time in degrees (east longitude positive). */
export function lstDeg(jd: number, lonEast: number): number {
  return norm360(gmstDeg(jd) + lonEast);
}

/** Ecliptic longitude (β≈0) → equatorial RA/Dec in degrees. */
export function eclipticToEquatorial(lonDeg: number): { ra: number; dec: number } {
  const l = lonDeg * DEG;
  const e = OBLIQUITY * DEG;
  const ra = Math.atan2(Math.cos(e) * Math.sin(l), Math.cos(l));
  const dec = Math.asin(Math.sin(e) * Math.sin(l));
  return { ra: norm360(ra / DEG), dec: dec / DEG };
}

export interface AltAz {
  alt: number; // degrees above horizon (negative = below)
  az: number; // degrees clockwise from North
}

/** Equatorial RA/Dec → local altitude/azimuth. */
export function equatorialToAltAz(
  raDeg: number,
  decDeg: number,
  latDeg: number,
  lstDegVal: number
): AltAz {
  const ha = (lstDegVal - raDeg) * DEG; // hour angle
  const dec = decDeg * DEG;
  const lat = latDeg * DEG;
  const sinAlt = Math.sin(dec) * Math.sin(lat) + Math.cos(dec) * Math.cos(lat) * Math.cos(ha);
  const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
  const az = Math.atan2(
    Math.sin(ha),
    Math.cos(ha) * Math.sin(lat) - Math.tan(dec) * Math.cos(lat)
  );
  // atan2 above gives azimuth from South; convert to from-North clockwise.
  return { alt: alt / DEG, az: norm360(az / DEG + 180) };
}

export function eclipticAltAz(
  lonDeg: number,
  latDeg: number,
  lstDegVal: number
): AltAz {
  const { ra, dec } = eclipticToEquatorial(lonDeg);
  return equatorialToAltAz(ra, dec, latDeg, lstDegVal);
}

export function norm360(x: number): number {
  return ((x % 360) + 360) % 360;
}
