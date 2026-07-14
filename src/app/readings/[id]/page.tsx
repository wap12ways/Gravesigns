import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getReading } from "@/lib/supabase";
import { ReadingDisplay } from "@/components/reading-display";
import type { ReadingResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ReadingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const row = await getReading(id);
  if (!row) notFound();

  const data: ReadingResponse = {
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
    persisted: true,
  };

  return (
    <div className="container px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/readings"
          className="mb-6 inline-flex items-center gap-2 text-sm text-foreground/60 transition-colors hover:text-gold-light"
        >
          <ArrowLeft className="h-4 w-4" />
          All readings
        </Link>
        <ReadingDisplay data={data} />
      </div>
    </div>
  );
}
