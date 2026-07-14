import type { PlanetDignity } from "@/lib/analysis";
import { PLANET_GLYPH, SIGN_GLYPH } from "@/lib/glyphs";

function scoreClass(n: number) {
  if (n > 0) return "text-emerald-300/90";
  if (n < 0) return "text-rose-300/85";
  return "text-muted-foreground";
}
function signed(n: number) {
  return n > 0 ? `+${n}` : `${n}`;
}

/** The essential + accidental dignity ledger (Lilly's point scheme). */
export function DignitiesTable({
  dignities,
  almuten,
}: {
  dignities: PlanetDignity[];
  almuten: { planet: string; score: number } | null;
}) {
  const sorted = [...dignities].sort((a, b) => b.total - a.total);
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[440px] border-collapse text-sm">
          <thead>
            <tr className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              <th className="pb-2 text-left font-normal">Planet</th>
              <th className="pb-2 text-left font-normal">Sign</th>
              <th className="pb-2 text-left font-normal">Dignities</th>
              <th className="pb-2 text-right font-normal">Ess.</th>
              <th className="pb-2 text-right font-normal">Acc.</th>
              <th className="pb-2 text-right font-normal">Total</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((d) => {
              const e = d.essential;
              const tags = [
                e.domicile && "domicile",
                e.exaltation && "exaltation",
                e.triplicity && "triplicity",
                e.term && "term",
                e.face && "face",
                e.detriment && "detriment",
                e.fall && "fall",
                e.peregrine && "peregrine",
              ].filter(Boolean) as string[];
              return (
                <tr key={d.planet} className="border-t border-white/5">
                  <td className="py-2 text-foreground/90">
                    <span className="mr-1.5 text-gold-light">{PLANET_GLYPH[d.planet]}</span>
                    {d.planet}
                  </td>
                  <td className="py-2 text-foreground/70">
                    <span className="mr-1 text-gold/70">{SIGN_GLYPH[d.sign]}</span>
                    {d.sign}
                  </td>
                  <td className="py-2">
                    <div className="flex flex-wrap gap-1">
                      {tags.length ? (
                        tags.map((t) => (
                          <span
                            key={t}
                            className={`rounded px-1.5 py-0.5 text-[10px] ${
                              t === "detriment" || t === "fall" || t === "peregrine"
                                ? "bg-rose-500/10 text-rose-200/80"
                                : "bg-emerald-500/10 text-emerald-200/80"
                            }`}
                          >
                            {t}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </td>
                  <td className={`py-2 text-right tabular-nums ${scoreClass(e.score)}`}>{signed(e.score)}</td>
                  <td className={`py-2 text-right tabular-nums ${scoreClass(d.accidental.score)}`}>{signed(d.accidental.score)}</td>
                  <td className={`py-2 text-right font-semibold tabular-nums ${scoreClass(d.total)}`}>{signed(d.total)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {almuten && (
        <p className="mt-3 text-xs text-muted-foreground">
          Almuten of the Ascendant degree —{" "}
          <span className="text-gold-light">{PLANET_GLYPH[almuten.planet]} {almuten.planet}</span>{" "}
          — the planet with the greatest claim over the rising degree, read as the ruler of the whole geniture.
        </p>
      )}
    </div>
  );
}
