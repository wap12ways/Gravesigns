"use client";

import { useState } from "react";
import type { JudgmentDossier } from "@/lib/types";

/**
 * "The Astrologer's Casebook" — a transparent look at the weighted testimonies
 * the judgment pass drew from the chart before the reading was composed. It lets
 * the reader see the technical evidence, sourced, behind the prose.
 */
export function DossierNotes({ dossier }: { dossier: JudgmentDossier }) {
  const [open, setOpen] = useState(false);
  const factors = [...dossier.factors].sort((a, b) => b.weight - a.weight);
  const shown = open ? factors : factors.slice(0, 5);

  return (
    <div>
      <h3 className="font-serif text-2xl gold-text">The Astrologer&rsquo;s Casebook</h3>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Before a word was written, each testimony in the chart was weighed and sourced.
        These are the strongest, in the order they carried.
      </p>

      {dossier.primary_themes.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {dossier.primary_themes.map((t) => (
            <span key={t} className="rounded-full border border-gold/25 bg-gold/5 px-3 py-1 text-xs text-gold-light/85">
              {t}
            </span>
          ))}
        </div>
      )}

      <div className="mt-5 space-y-3">
        {shown.map((f, i) => (
          <div key={i} className="rounded-xl border border-white/5 bg-black/20 px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="text-sm text-foreground/90">{f.factor}</div>
              <div className="flex shrink-0 items-center gap-1.5" title={`weight ${f.weight.toFixed(2)}`}>
                {Array.from({ length: 5 }).map((_, k) => (
                  <span
                    key={k}
                    className={`h-1.5 w-1.5 rounded-full ${k < Math.round(f.weight * 5) ? "bg-gold" : "bg-white/10"}`}
                  />
                ))}
              </div>
            </div>
            <div className="mt-1 text-xs italic text-foreground/65">{f.direction}</div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
              <span className="text-gold/60">{f.source}</span>
              {f.tradition_vs_modern !== "both" && <span>· {f.tradition_vs_modern}</span>}
              {f.concordance > 1 && <span>· {f.concordance} concurring</span>}
              {f.birthtime_dependent && <span className="text-amber-300/60">· birth-time dependent</span>}
              {f.indeterminate && <span className="text-amber-300/60">· indeterminate</span>}
            </div>
            {f.theme_tokens.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {f.theme_tokens.map((t) => (
                  <span key={t} className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-muted-foreground">{t}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {factors.length > 5 && (
        <button
          onClick={() => setOpen((o) => !o)}
          className="mt-4 text-xs tracking-wide text-gold-light/80 hover:text-gold-light"
        >
          {open ? "Show fewer" : `Show all ${factors.length} testimonies`}
        </button>
      )}

      {(dossier.suppressed_techniques.length > 0 || dossier.limits) && (
        <div className="mt-5 border-t border-white/5 pt-4 text-xs text-muted-foreground/80">
          {dossier.limits && <p className="italic">{dossier.limits}</p>}
          {dossier.suppressed_techniques.length > 0 && (
            <p className="mt-1">
              <span className="text-muted-foreground">Set aside for want of data:</span>{" "}
              {dossier.suppressed_techniques.join("; ")}.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
