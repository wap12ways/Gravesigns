import { NextRequest, NextResponse } from "next/server";
import { getReading } from "@/lib/supabase";
import type { ReadingResponse } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const row = await getReading(id);
  if (!row) {
    return NextResponse.json({ error: "Reading not found." }, { status: 404 });
  }

  const response: ReadingResponse = {
    id: row.id,
    createdAt: row.created_at,
    fullName: row.full_name,
    subjectType: row.subject_type,
    dateOfDeath: row.date_of_death,
    timeOfDeath: row.time_of_death,
    place: row.place,
    notes: row.notes,
    chart: row.chart,
    reading: row.reading_markdown,
    model: row.model,
    dossier: row.dossier ?? null,
    natalChart: row.natal_chart ?? null,
    ethicsReview: row.ethics_review ?? null,
    persisted: true,
  };
  return NextResponse.json(response);
}
