import { NextRequest, NextResponse } from "next/server";
import { computeDeathChart } from "@/lib/astrology";
import { runReadingPipeline, READING_MODEL } from "@/lib/pipeline";
import { saveReading, listReadings, isSupabaseConfigured } from "@/lib/supabase";
import type {
  EthicsReview,
  JudgmentDossier,
  ReadingRequest,
  ReadingResponse,
  StudyNotes,
  SubjectType,
} from "@/lib/types";

// The reading runs six sequential Claude passes (judgment → synthesis →
// composition → ethics → verification → study notes), so it needs real headroom.
// The passes are model-tiered by default (Opus for the reading, Sonnet for the
// five ancillary passes) to fit inside the limit. Vercel honours maxDuration up
// to the plan's ceiling — 300s on Pro/Enterprise, capped to 60s on Hobby (where
// the all-Opus profile will time out; keep the tiered default there).
export const maxDuration = 300;
export const runtime = "nodejs";

/**
 * Best-effort, keyless geocoding via Open-Meteo so that a supplied place +
 * time can unlock the houses and angles. Never blocks the reading — any
 * failure simply means we fall back to a sign/aspect-only chart.
 */
async function geocode(
  place: string
): Promise<{ lat: number; lon: number } | null> {
  try {
    const name = place.split(",")[0].trim();
    if (!name) return null;
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 4000);
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      name
    )}&count=1&language=en&format=json`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(t);
    if (!res.ok) return null;
    const data = await res.json();
    const hit = data?.results?.[0];
    if (typeof hit?.latitude === "number" && typeof hit?.longitude === "number") {
      return { lat: hit.latitude, lon: hit.longitude };
    }
    return null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  let body: ReadingRequest;
  try {
    body = (await req.json()) as ReadingRequest;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const fullName = (body.fullName || "").trim();
  const dateOfDeath = (body.dateOfDeath || "").trim();
  const type: SubjectType = body.type === "pet" ? "pet" : "human";
  const timeOfDeath = body.timeOfDeath?.trim() || null;
  const place = body.place?.trim() || null;
  const notes = body.notes?.trim() || null;

  // Optional IANA time-zone override — validate it's a real zone before use.
  let timezone: string | null = body.timezone?.trim() || null;
  if (timezone) {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: timezone });
    } catch {
      timezone = null; // silently ignore an invalid zone; auto-detect instead
    }
  }

  if (!fullName) {
    return NextResponse.json(
      { error: "The name of the deceased is required." },
      { status: 400 }
    );
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfDeath)) {
    return NextResponse.json(
      { error: "A valid date of death (YYYY-MM-DD) is required." },
      { status: 400 }
    );
  }

  // Resolve coordinates when a place was given (only useful with a time too).
  let latitude = typeof body.latitude === "number" ? body.latitude : null;
  let longitude = typeof body.longitude === "number" ? body.longitude : null;
  if ((latitude === null || longitude === null) && place && timeOfDeath) {
    const geo = await geocode(place);
    if (geo) {
      latitude = geo.lat;
      longitude = geo.lon;
    }
  }

  // 1) Calculate the death chart.
  let chart;
  try {
    chart = await computeDeathChart({
      dateOfDeath,
      timeOfDeath,
      latitude,
      longitude,
      timezone,
    });
  } catch (err) {
    console.error("Chart calculation failed:", err);
    return NextResponse.json(
      { error: "The chart could not be calculated for that moment." },
      { status: 400 }
    );
  }

  // 1b) Optionally calculate the natal chart from birth details. Never blocks
  //     the reading — any failure simply omits the natal (Tier-2) depth.
  const birthDate = body.birthDate?.trim() || null;
  const birthTime = body.birthTime?.trim() || null;
  const birthPlace = body.birthPlace?.trim() || null;
  let natalChart: Awaited<ReturnType<typeof computeDeathChart>> | null = null;
  if (birthDate && /^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    let bLat = typeof body.birthLatitude === "number" ? body.birthLatitude : null;
    let bLon = typeof body.birthLongitude === "number" ? body.birthLongitude : null;
    let bTz: string | null = body.birthTimezone?.trim() || null;
    if (bTz) {
      try {
        new Intl.DateTimeFormat("en-US", { timeZone: bTz });
      } catch {
        bTz = null;
      }
    }
    if ((bLat === null || bLon === null) && birthPlace && birthTime) {
      const geo = await geocode(birthPlace);
      if (geo) {
        bLat = geo.lat;
        bLon = geo.lon;
      }
    }
    try {
      natalChart = await computeDeathChart({
        dateOfDeath: birthDate,
        timeOfDeath: birthTime,
        latitude: bLat,
        longitude: bLon,
        timezone: bTz,
      });
    } catch (err) {
      console.error("Natal chart calculation failed (continuing without it):", err);
      natalChart = null;
    }
  }

  // 2) Generate the reading through the pipeline (Step-0 analysis → judgment →
  //    composition → ethics → verification → study notes).
  let reading: string;
  let dossier: JudgmentDossier | null = null;
  let ethicsReview: EthicsReview | null = null;
  let studyNotes: StudyNotes | null = null;
  try {
    const result = await runReadingPipeline({
      fullName,
      subjectType: type,
      dateOfDeath,
      timeOfDeath,
      place,
      notes,
      chart,
      natalChart,
      birthDate,
    });
    reading = result.reading;
    dossier = result.dossier;
    ethicsReview = result.ethicsReview;
    studyNotes = result.studyNotes;
  } catch (err) {
    console.error("Reading generation failed:", err);
    const message =
      err instanceof Error && err.message.includes("ANTHROPIC_API_KEY")
        ? "The reading service is not configured (missing ANTHROPIC_API_KEY)."
        : "The reading could not be composed just now. Please try again.";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  // 3) Persist to Supabase (no-op in demo mode).
  const id = await saveReading({
    fullName,
    subjectType: type,
    dateOfDeath,
    timeOfDeath,
    place,
    latitude,
    longitude,
    notes,
    chart,
    readingMarkdown: reading,
    model: READING_MODEL,
    dossier,
    natalChart,
    ethicsReview,
    studyNotes,
  });

  const response: ReadingResponse = {
    id: id ?? `demo-${Date.now()}`,
    createdAt: new Date().toISOString(),
    fullName,
    subjectType: type,
    dateOfDeath,
    timeOfDeath,
    place,
    notes,
    chart,
    reading,
    model: READING_MODEL,
    dossier,
    natalChart,
    ethicsReview,
    studyNotes,
    persisted: Boolean(id),
  };

  return NextResponse.json(response, { status: 200 });
}

/** List recent readings (for the demo "Previous Readings" gallery). */
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ readings: [], configured: false });
  }
  const rows = await listReadings(12);
  const readings = rows.map((r) => ({
    id: r.id,
    createdAt: r.created_at,
    fullName: r.full_name,
    subjectType: r.subject_type,
    dateOfDeath: r.date_of_death,
    place: r.place,
    moonPhase: r.chart?.moonPhase ?? null,
  }));
  return NextResponse.json({ readings, configured: true });
}
