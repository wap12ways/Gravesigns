export type SubjectType = "human" | "pet";

/** Shape of the interactive form, sent to POST /api/readings */
export interface ReadingRequest {
  fullName: string;
  /** ISO date string, YYYY-MM-DD — required */
  dateOfDeath: string;
  /** HH:MM (24h) — optional; noon is assumed when absent */
  timeOfDeath?: string | null;
  /** Free-text place of death: "City, Country" — optional */
  place?: string | null;
  /** Optional latitude/longitude if resolved on the client */
  latitude?: number | null;
  longitude?: number | null;
  type: SubjectType;
  /**
   * Optional IANA time-zone override (e.g. "America/New_York"). When absent,
   * the zone is auto-detected from the place of death.
   */
  timezone?: string | null;
  /** Personality traits, cultural background, special notes — optional */
  notes?: string | null;
}

/** A single planetary placement in the death chart */
export interface PlanetPosition {
  name: string;
  /** Ecliptic longitude in degrees, 0–360 */
  longitude: number;
  sign: string;
  /** Degrees within the sign, 0–30 */
  degreeInSign: number;
  /** Whole house 1–12 (null when no birth time / location was supplied) */
  house: number | null;
  retrograde: boolean;
  /** Ecliptic longitude speed (deg/day); negative = retrograde */
  speed: number;
}

export interface Aspect {
  a: string;
  b: string;
  type: string;
  /** How far from exact, in degrees */
  orb: number;
}

export interface DeathChart {
  /** UTC timestamp used for the calculation */
  timestampUtc: string;
  /** Whether a real time-of-death (not the noon fallback) was supplied */
  timeKnown: boolean;
  /** Whether a location was supplied, enabling houses + angles */
  locationKnown: boolean;
  latitude: number | null;
  longitude: number | null;
  ascendant: { sign: string; degreeInSign: number } | null;
  midheaven: { sign: string; degreeInSign: number } | null;
  /** Absolute ecliptic longitude of the Ascendant / MC (for chart rendering) */
  ascendantLon: number | null;
  midheavenLon: number | null;
  /** House cusp longitudes; index 1–12 populated (0 unused), [] when no houses */
  houseCusps: number[];
  /** Chart sect: day if the Sun is above the horizon, else night */
  sect: "day" | "night";
  planets: PlanetPosition[];
  aspects: Aspect[];
  /** The dominant element across the luminaries and personal planets */
  dominantElement: string;
  dominantModality: string;
  moonPhase: string;
  /** Which Swiss Ephemeris data source produced the positions */
  ephemeris: string;
  /** The IANA civil time zone used to resolve the moment to UTC, if known */
  timezone: string | null;
}

/**
 * One weighted testimony produced by the AI judgment pass (Pass A). Each is a
 * single, source-anchored piece of evidence — never a verdict about cause,
 * manner, or lifespan.
 */
export interface JudgmentFactor {
  /** The technical fact, e.g. "Saturn in the 8th, ruling the 8th cusp" */
  factor: string;
  /** Where the technique comes from, e.g. "Lilly CA p.653; Dorotheus III" */
  source: string;
  tradition_vs_modern: "traditional" | "modern" | "both";
  /** 0–1 salience for the composition pass */
  weight: number;
  /** The felt/interpretive direction — comforting, heavy, ambivalent, etc. */
  direction: string;
  /** Caveats on strength (out of sign, wide orb, cadent, etc.) */
  condition_notes: string;
  /** True when the reading of this factor depends on a birth time we may lack */
  birthtime_dependent: boolean;
  /** Short interpretive tags the composer can weave, e.g. ["water","surrender"] */
  theme_tokens: string[];
  /** How many independent testimonies concur with this theme */
  concordance: number;
  confidence: number;
  /** True when the data genuinely can't decide this */
  indeterminate: boolean;
}

export interface JudgmentDossier {
  /** The two or three overarching themes the testimonies converge on */
  primary_themes: string[];
  factors: JudgmentFactor[];
  /** Techniques deliberately withheld (e.g. length-of-life without birth data) */
  suppressed_techniques: string[];
  /** One-line honest statement of what this chart cannot show */
  limits: string;
}

/** What Pass C (verification) reports back about a drafted reading. */
export interface VerificationReport {
  approved: boolean;
  /** Problems found: fabricated placements, forbidden claims, tone slips */
  issues: string[];
}

export interface Reading {
  id: string;
  created_at: string;
  full_name: string;
  subject_type: SubjectType;
  date_of_death: string;
  time_of_death: string | null;
  place: string | null;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  chart: DeathChart;
  reading_markdown: string;
  model: string;
}

/** Response body from POST /api/readings and GET /api/readings/[id] */
export interface ReadingResponse {
  id: string;
  createdAt: string;
  fullName: string;
  subjectType: SubjectType;
  dateOfDeath: string;
  timeOfDeath: string | null;
  place: string | null;
  notes: string | null;
  chart: DeathChart;
  reading: string;
  model: string;
  /** The Pass-A judgment dossier, when the pipeline produced one */
  dossier?: JudgmentDossier | null;
  /** true when saved to Supabase; false in demo/unconfigured mode */
  persisted: boolean;
}
