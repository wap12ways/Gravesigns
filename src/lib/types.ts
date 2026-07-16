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

  // ── Optional birth details ──────────────────────────────────────────────
  // When supplied, a natal chart is cast and the reading gains the traditional
  // length-of-life doctrine, the natal-to-death cross-aspects, and a bi-wheel.
  /** ISO date string, YYYY-MM-DD */
  birthDate?: string | null;
  /** HH:MM (24h) */
  birthTime?: string | null;
  birthPlace?: string | null;
  birthLatitude?: number | null;
  birthLongitude?: number | null;
  birthTimezone?: string | null;
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

// ── Knowledge corpus ────────────────────────────────────────────────────────
// A general, versioned store of the proprietary compilation of public reference
// material the reading engine draws on. Ethics is the first kind; more kinds
// (association standards, articles, webinar transcripts, published readings,
// case data) are added WITHOUT schema or code changes — only new rows and,
// optionally, new `KnowledgeKind` values.
export type KnowledgeKind =
  | "code_of_ethics"
  // The interpretive corpus: factor-keyed delineations the composition pass
  // draws on for depth (Moon-by-sign, the mortal significators, the death
  // houses, the Lots, the fixed stars). Entries ride in `metadata.entries`.
  | "delineation"
  // A vetted bibliography of PUBLIC-DOMAIN classical sources — the legal-path
  // corpus the practice may ingest and store, with per-work rights status.
  | "classical_source"
  // Reserved for later phases — listed so the type never has to be widened in a
  // breaking way. Consumers should treat KnowledgeKind as open-ended.
  | "association_standard"
  | "article"
  | "webinar_transcript"
  | "published_reading"
  | "case_data"
  | (string & {});

/**
 * One interpretive delineation in the death-chart corpus (kind `delineation`).
 * The composition pass reads only the entries whose `key` matches a factor
 * actually present in the chart, so the reference stays targeted, not a dump.
 * The bodies are traditional doctrine read as MEANING — never a cause, manner,
 * date, or length of death, and never quoted verbatim into the reading.
 */
export interface DelineationEntry {
  /**
   * The match token the retrieval derives from the live chart, e.g.
   * "moon:Scorpio", "phase:Full Moon", "sect:night", "significator:Saturn",
   * "house:8", "lot:Lot of Death", "star:Algol", "shape:Bowl", "element:Water".
   */
  key: string;
  /** The factor family, used to rank and group what is retrieved. */
  family:
    | "moon"
    | "sun"
    | "phase"
    | "sect"
    | "element"
    | "modality"
    | "shape"
    | "significator"
    | "ruler"
    | "dignity"
    | "aspect"
    | "pattern"
    | "house"
    | "lot"
    | "star";
  /** Short label shown in the reference brief. */
  title: string;
  /** The interpretive delineation — traditional doctrine, tender and precise. */
  body: string;
  /** The tradition the doctrine comes from — a study trail, not a quotation. */
  source?: string;
  /** Whether the entry reads on a single moment, a nativity, or both. */
  applies?: "moment" | "natal" | "both";
}

/**
 * One document in the knowledge corpus. `content` is the canonical text
 * (Markdown); `sections` optionally breaks it into addressable parts; anything
 * a particular kind needs beyond these fields lives in `metadata`, so new kinds
 * never require a schema change.
 */
export interface KnowledgeDocument {
  slug: string;
  kind: KnowledgeKind;
  title: string;
  /** Provenance — a URL or citation. */
  source?: string | null;
  /** Copyright / licence / rights notice, kept verbatim. */
  attribution?: string | null;
  /** Publisher's version marker, e.g. "Revised October 1998". */
  version?: string | null;
  status?: "active" | "archived" | "draft";
  /** The full document text (Markdown). */
  content: string;
  /** Optional structured breakdown (e.g. chapters / clauses). */
  sections?: KnowledgeSection[];
  /**
   * Kind-specific extras. For `code_of_ethics` this carries
   * `operating_summary` — a short distillation injected at composition time.
   */
  metadata?: Record<string, unknown>;
}

export interface KnowledgeSection {
  /** Stable identifier within the document, e.g. "A.4". */
  ref: string;
  heading: string;
  body: string;
}

/**
 * One verbatim excerpt from a PUBLIC-DOMAIN primary source (kind
 * `classical_source`, carried in `metadata.passages`). Retrieved by the same
 * factor keys as the delineations and folded into the composition pass as a
 * secondary reference — the tradition in its own words. Only temperament /
 * nature passages are stored; anything asserting a cause or manner of death is
 * deliberately excluded, as the practice never reads for cause or manner.
 */
export interface ClassicalPassage {
  /** Factor key, same scheme as delineations, e.g. "significator:Saturn". */
  key: string;
  /** The work, e.g. "Ptolemy, Tetrabiblos". */
  work: string;
  /** The citation, e.g. "Book I, ch. 4 (Ashmand trans., 1822; public domain)". */
  ref: string;
  /** The verbatim excerpt (typography normalized; wording unchanged). */
  text: string;
}

/**
 * The output of Pass E (Ethical Alignment): a transparent record of how the
 * drafted reading measured against the loaded Code(s) of Ethics, and what — if
 * anything — was adjusted to bring it into alignment.
 */
export interface EthicsReview {
  aligned: boolean;
  /** Which codes were consulted, by slug, e.g. ["ncgr-code-of-ethics"]. */
  codes: string[];
  /** Specific tenets the reading touched, honoured, or risked breaching. */
  concerns: EthicsConcern[];
  /** Plain-language notes on what was changed to align the reading. */
  adjustments: string[];
  /** True when Pass E rewrote the draft (vs. passing it through unchanged). */
  revised: boolean;
}

export interface EthicsConcern {
  /** The code the clause belongs to, e.g. "NCGR". */
  code: string;
  /** The clause reference, e.g. "A.4" or "D.1". */
  clause: string;
  /** What in the reading engaged this clause. */
  observation: string;
  severity: "honored" | "minor" | "material";
}

/**
 * Study notes — the working astrologer's private notebook on a chart, in the
 * candid, technical, first-person shorthand a professional jots while studying
 * (as opposed to the tender family-facing reading or the weighted dossier).
 * These accumulate the practice's craft reasoning over time.
 */
export interface StudyNote {
  /**
   * The facet of the notebook. Open-ended so new lenses can be added without a
   * breaking type change:
   *   craft      — technique applied & why, notable configurations, judgment calls
   *   research   — questions to investigate, cross-references, "go read X"
   *   confidence — where the chart is strong vs. thin; methodological candor
   */
  category: "craft" | "research" | "confidence" | (string & {});
  /** A short label for the note. */
  heading: string;
  /** The note body — a sentence or two of working shorthand. */
  note: string;
  /** Sources / cross-references the note points to, when any. */
  refs?: string[];
}

export interface StudyNotes {
  entries: StudyNote[];
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
  dossier?: JudgmentDossier | null;
  natal_chart?: DeathChart | null;
  ethics_review?: EthicsReview | null;
  study_notes?: StudyNotes | null;
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
  /** The natal chart, when birth details were supplied */
  natalChart?: DeathChart | null;
  /** The Pass-E ethical-alignment record, when the pipeline produced one */
  ethicsReview?: EthicsReview | null;
  /** The practitioner's study notes, when the pipeline produced them */
  studyNotes?: StudyNotes | null;
  /** true when saved to Supabase; false in demo/unconfigured mode */
  persisted: boolean;
}
