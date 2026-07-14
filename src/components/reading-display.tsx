import type { ReadingResponse } from "@/lib/types";
import { renderMarkdown } from "@/lib/markdown";
import { ChartSummary } from "./chart-summary";
import { Card, CardContent } from "./ui/card";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export function ReadingDisplay({ data }: { data: ReadingResponse }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-7">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-[0.24em] text-gold/70">
                Death Chart · {data.subjectType === "pet" ? "Beloved Companion" : "In Memoriam"}
              </div>
              <h2 className="mt-1 font-serif text-3xl gold-text">
                {data.fullName}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Crossed {formatDate(data.dateOfDeath)}
                {data.timeOfDeath ? ` at ${data.timeOfDeath}` : ""}
                {data.place ? ` · ${data.place}` : ""}
              </p>
            </div>
            {!data.persisted && (
              <span className="rounded-full border border-gold/25 bg-gold/5 px-3 py-1 text-[11px] text-gold-light/80">
                Demo mode · not saved
              </span>
            )}
          </div>

          <div className="mb-2 text-xs uppercase tracking-[0.14em] text-foreground/60">
            The Calculated Sky
          </div>
          <ChartSummary chart={data.chart} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-8">
          <article
            className="reading-prose"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(data.reading) }}
          />
          <div className="mt-10 border-t border-white/5 pt-4 text-center text-[11px] text-muted-foreground/70">
            Prepared by GraveSigns · A death chart is a contemplative offering,
            not medical, legal, or psychological advice.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
