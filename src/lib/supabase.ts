import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type {
  DeathChart,
  EthicsReview,
  JudgmentDossier,
  Reading,
  StudyNotes,
  SubjectType,
} from "./types";

/**
 * Server-side Supabase access. We prefer the service-role key (server only,
 * never exposed to the browser) so the API route can write readings even with
 * row-level security enabled. If Supabase isn't configured, every helper here
 * degrades to a no-op "demo mode" so the app still runs end-to-end.
 */
let cached: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  cached = createClient(url, key, {
    auth: { persistSession: false },
  });
  return cached;
}

export function isSupabaseConfigured(): boolean {
  return getSupabase() !== null;
}

interface SaveArgs {
  fullName: string;
  subjectType: SubjectType;
  dateOfDeath: string;
  timeOfDeath: string | null;
  place: string | null;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  chart: DeathChart;
  readingMarkdown: string;
  model: string;
  /** The Pass-A judgment dossier (optional; requires the `dossier` column) */
  dossier?: JudgmentDossier | null;
  /** The natal chart, when birth details were supplied (requires `natal_chart`) */
  natalChart?: DeathChart | null;
  /** The Pass-E ethical-alignment record (optional; requires `ethics_review`) */
  ethicsReview?: EthicsReview | null;
  /** The practitioner's study notes (optional; requires `study_notes`) */
  studyNotes?: StudyNotes | null;
}

/** Returns the new row's id, or null when Supabase is not configured. */
export async function saveReading(args: SaveArgs): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const base = {
    full_name: args.fullName,
    subject_type: args.subjectType,
    date_of_death: args.dateOfDeath,
    time_of_death: args.timeOfDeath,
    place: args.place,
    latitude: args.latitude,
    longitude: args.longitude,
    notes: args.notes,
    chart: args.chart,
    reading_markdown: args.readingMarkdown,
    model: args.model,
  };
  const withExtras = {
    ...base,
    dossier: args.dossier ?? null,
    natal_chart: args.natalChart ?? null,
    ethics_review: args.ethicsReview ?? null,
    study_notes: args.studyNotes ?? null,
  };

  // Try the full row first; if the new columns don't exist yet on this database,
  // fall back to the base row so a reading is never lost to a schema lag.
  let res = await supabase.from("readings").insert(withExtras).select("id").single();
  if (res.error && /dossier|natal_chart|ethics_review|study_notes|column/i.test(res.error.message)) {
    res = await supabase.from("readings").insert(base).select("id").single();
  }
  if (res.error) {
    console.error("Supabase saveReading error:", res.error.message);
    return null;
  }
  return res.data?.id ?? null;
}

export async function getReading(id: string): Promise<Reading | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("readings")
    .select("*")
    .eq("id", id)
    .single();
  if (error) {
    console.error("Supabase getReading error:", error.message);
    return null;
  }
  return data as Reading;
}

export async function listReadings(limit = 12): Promise<Reading[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("readings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("Supabase listReadings error:", error.message);
    return [];
  }
  return (data as Reading[]) ?? [];
}
