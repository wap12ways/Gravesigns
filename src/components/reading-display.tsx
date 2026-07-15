import type { ReadingResponse } from "@/lib/types";
import { renderMarkdown } from "@/lib/markdown";
import { ChartPanel } from "./chart/chart-panel";
import { DossierNotes } from "./chart/dossier-notes";
import { StudyNotesPanel } from "./chart/study-notes";
import { PrintButton } from "./print-button";
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
      <Card className="no-print">
        <CardContent className="pt-7">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-serif text-3xl gold-text">
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

          <div className="mb-4 font-serif text-lg text-foreground/75">
            The calculated sky
          </div>
          <ChartPanel chart={data.chart} natalChart={data.natalChart} />

          <p className="mt-6 text-[11px] text-muted-foreground/60">
            Positions computed with {data.chart.ephemeris}. Tropical zodiac; Placidus
            houses (whole-sign fallback at extreme latitudes).
            {(!data.chart.timeKnown || !data.chart.locationKnown) && (
              <>
                {" "}
                {!data.chart.timeKnown
                  ? "No time of death was given, so noon was assumed and the houses and angles are set aside. "
                  : "No place of death was given, so the houses and angles are set aside. "}
                The reading leans on the planetary signs, aspects, and Moon phase.
              </>
            )}
          </p>
        </CardContent>
      </Card>

      <Card className="print-keepsake">
        <CardContent className="pt-8">
          {/* Print-only header — the keepsake's title block */}
          <div className="print-only mb-8 text-center">
            <div className="font-serif text-base italic text-foreground/60">
              GraveSigns — a death chart reading for
            </div>
            <h1 className="mt-1 font-serif text-3xl">{data.fullName}</h1>
            <p className="mt-1 text-sm">
              Crossed {formatDate(data.dateOfDeath)}
              {data.timeOfDeath ? ` at ${data.timeOfDeath}` : ""}
              {data.place ? ` · ${data.place}` : ""}
            </p>
          </div>

          <article
            className="reading-prose"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(data.reading) }}
          />
          <div className="mt-10 flex flex-col items-center gap-4 border-t border-white/5 pt-5">
            <PrintButton />
            <p className="text-center text-[11px] text-muted-foreground/70">
              Prepared by GraveSigns · A death chart is a contemplative offering,
              not medical, legal, or psychological advice.
            </p>
          </div>
        </CardContent>
      </Card>

      {data.dossier && data.dossier.factors.length > 0 && (
        <Card className="no-print">
          <CardContent className="pt-7">
            <DossierNotes dossier={data.dossier} />
          </CardContent>
        </Card>
      )}

      {data.studyNotes && data.studyNotes.entries.length > 0 && (
        <Card className="no-print">
          <CardContent className="pt-7">
            <StudyNotesPanel notes={data.studyNotes} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
