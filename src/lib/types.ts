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
  planets: PlanetPosition[];
  aspects: Aspect[];
  /** The dominant element across the luminaries and personal planets */
  dominantElement: string;
  dominantModality: string;
  moonPhase: string;
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
  /** true when saved to Supabase; false in demo/unconfigured mode */
  persisted: boolean;
}
