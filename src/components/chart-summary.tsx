import type { DeathChart } from "@/lib/types";

const GLYPHS: Record<string, string> = {
  Sun: "☉",
  Moon: "☽",
  Mercury: "☿",
  Venus: "♀",
  Mars: "♂",
  Jupiter: "♃",
  Saturn: "♄",
  Uranus: "♅",
  Neptune: "♆",
  Pluto: "♇",
  "North Node": "☊",
};

function fmt(deg: number) {
  const d = Math.floor(deg);
  const m = Math.round((deg - d) * 60);
  return `${d}°${String(m).padStart(2, "0")}′`;
}

/** Elegant, at-a-glance rendering of the calculated chart. */
export function ChartSummary({ chart }: { chart: DeathChart }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
        <Stat label="Moon Phase" value={chart.moonPhase} />
        <Stat label="Dominant Element" value={chart.dominantElement} />
        <Stat label="Modality" value={chart.dominantModality} />
        {chart.ascendant && (
          <Stat
            label="Ascendant"
            value={`${fmt(chart.ascendant.degreeInSign)} ${chart.ascendant.sign}`}
          />
        )}
        {chart.midheaven && (
          <Stat
            label="Midheaven"
            value={`${fmt(chart.midheaven.degreeInSign)} ${chart.midheaven.sign}`}
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {chart.planets.map((p) => (
          <div
            key={p.name}
            className="flex items-center gap-3 rounded-xl border border-white/5 bg-black/20 px-3 py-2.5"
          >
            <span className="text-xl text-gold-light/90 w-6 text-center">
              {GLYPHS[p.name] ?? "✷"}
            </span>
            <div className="min-w-0">
              <div className="truncate text-[13px] font-medium text-foreground/90">
                {p.name}
                {p.retrograde && (
                  <span className="ml-1 text-gold/70" title="Retrograde">
                    ℞
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {fmt(p.degreeInSign)} {p.sign}
                {p.house ? ` · H${p.house}` : ""}
              </div>
            </div>
          </div>
        ))}
      </div>

      {chart.aspects.length > 0 && (
        <div>
          <div className="mb-2 text-xs uppercase tracking-[0.14em] text-foreground/60">
            Notable Aspects
          </div>
          <div className="flex flex-wrap gap-2">
            {chart.aspects.slice(0, 8).map((a, i) => (
              <span
                key={i}
                className="rounded-full border border-gold/20 bg-gold/5 px-3 py-1 text-xs text-foreground/75"
              >
                {a.a} {a.type} {a.b}
                <span className="ml-1 text-muted-foreground/70">
                  {a.orb.toFixed(1)}°
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {(!chart.timeKnown || !chart.locationKnown) && (
        <p className="text-xs italic text-muted-foreground/80">
          {!chart.timeKnown
            ? "No time of death was given, so noon was assumed and the houses and angles are set aside. "
            : ""}
          {chart.timeKnown && !chart.locationKnown
            ? "No place of death was given, so the houses and angles are set aside. "
            : ""}
          The reading leans on the planetary signs, aspects, and Moon phase.
        </p>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </div>
      <div className="text-gold-light">{value}</div>
    </div>
  );
}
