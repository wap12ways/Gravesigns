import type { ChartAnalysis } from "@/lib/analysis";
import { PLANET_GLYPH, SIGN_GLYPH, fmtDeg } from "@/lib/glyphs";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-[10px] uppercase tracking-[0.16em] text-gold/70">{title}</div>
      {children}
    </div>
  );
}

/**
 * The death-specific testimony: the 8th/4th/12th complex, the Arabic Lots, the
 * mortal significators, fixed-star contacts, and the chart's overall shape.
 * These are the classical structures a specialist tabulates before interpreting.
 */
export function MortalityPanel({ analysis }: { analysis: ChartAnalysis }) {
  const { death, lots, fixedStars, patterns, shape } = analysis;

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <Section title="The Houses of Ending">
        <div className="space-y-2.5">
          {death.houses.map((h) => (
            <div key={h.house} className="rounded-lg border border-white/5 bg-black/20 px-3 py-2">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm text-foreground/90">
                  <span className="text-gold-light">{romize(h.house)}</span> house
                </span>
                {h.cuspSign && (
                  <span className="text-xs text-muted-foreground">
                    {SIGN_GLYPH[h.cuspSign]} {h.cuspSign} cusp
                  </span>
                )}
              </div>
              <div className="mt-0.5 text-[11px] italic text-muted-foreground/80">{h.role}</div>
              <div className="mt-1 text-xs text-foreground/70">
                {h.ruler && (
                  <>
                    ruler <span className="text-gold-light">{PLANET_GLYPH[h.ruler]} {h.ruler}</span>
                    {h.rulerPlacement && (
                      <> in {h.rulerPlacement.sign}{h.rulerPlacement.house != null ? `, ${romize(h.rulerPlacement.house)} house` : ""}{h.rulerPlacement.retrograde ? " ℞" : ""}</>
                    )}
                    {" · "}
                  </>
                )}
                {h.occupants.length ? (
                  <>tenanted by {h.occupants.map((o) => `${PLANET_GLYPH[o] ?? ""} ${o}`).join(", ")}</>
                ) : (
                  <span className="text-muted-foreground/70">empty</span>
                )}
              </div>
            </div>
          ))}
          {death.angularityUnknown && (
            <p className="text-[11px] italic text-muted-foreground/70">
              No time or place was known, so the houses and angles are set aside; the testimony leans on signs and aspects.
            </p>
          )}
        </div>
      </Section>

      <div className="space-y-6">
        <Section title="Arabic Lots">
          {lots.length ? (
            <div className="space-y-1.5">
              {lots.map((l) => (
                <div key={l.name} className="text-sm">
                  <span className="text-foreground/85">{l.name}</span>{" "}
                  <span className="text-gold-light">{fmtDeg(l.degreeInSign)} {SIGN_GLYPH[l.sign]} {l.sign}</span>
                  {l.house != null && <span className="text-muted-foreground"> · {romize(l.house)} house</span>}
                  <div className="text-[11px] text-muted-foreground/70">{l.formula} — {l.source}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Requires a known Ascendant and 8th cusp.</p>
          )}
        </Section>

        <Section title="Chart Shape">
          <p className="text-sm text-foreground/85">
            <span className="text-gold-light">{shape.shape}</span>
            <span className="text-muted-foreground"> — {shape.description}</span>
          </p>
        </Section>
      </div>

      <Section title="Mortal Significators">
        <div className="space-y-1.5">
          {death.mortalSignificators.map((m) => (
            <div key={m.name} className="text-xs">
              <span className="text-gold-light">{PLANET_GLYPH[m.name]} {m.name}</span>
              <span className="text-foreground/70"> in {m.sign}{m.house != null ? `, ${romize(m.house)} house` : ""}{m.retrograde ? " ℞" : ""}</span>
              <div className="text-[11px] italic text-muted-foreground/70">{m.note}</div>
            </div>
          ))}
          {death.maleficContacts.length > 0 && (
            <div className="mt-2 border-t border-white/5 pt-2">
              <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Hard malefic contacts</div>
              {death.maleficContacts.slice(0, 6).map((c, i) => (
                <div key={i} className="text-[11px] text-foreground/70">
                  {PLANET_GLYPH[c.malefic] ?? ""} {c.malefic} {c.aspect.toLowerCase()} {PLANET_GLYPH[c.body] ?? ""} {c.body}
                  <span className="text-muted-foreground/60"> ({c.orb}°)</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Section>

      <Section title="Fixed Stars & Patterns">
        <div className="space-y-2">
          {fixedStars.length ? (
            fixedStars.slice(0, 6).map((f, i) => (
              <div key={i} className="text-xs">
                <span className="text-gold-light">{f.star}</span>
                <span className="text-foreground/70"> ☌ {PLANET_GLYPH[f.body] ?? ""} {f.body} ({f.orb}°){f.royal ? " · royal" : ""}</span>
                <div className="text-[11px] italic text-muted-foreground/70">{f.keywords}</div>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">No fixed star within orb of a body or angle.</p>
          )}
          {patterns.length > 0 && (
            <div className="mt-1 border-t border-white/5 pt-2">
              {patterns.map((p, i) => (
                <div key={i} className="text-[11px] text-foreground/70">
                  <span className="text-gold-light/90">{p.type}:</span> {p.members.join(", ")}
                </div>
              ))}
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}

function romize(n: number): string {
  return ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"][n] ?? String(n);
}
