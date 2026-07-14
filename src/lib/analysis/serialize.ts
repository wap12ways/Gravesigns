/**
 * Renders the deterministic ChartAnalysis into a dense, human-readable evidence
 * brief. This text is what the AI judgment pass reads — it is the tabulated
 * testimony a professional would lay out before interpreting, with every claim
 * already computed so the model never has to (and never should) do astronomy.
 */
import type { DeathChart } from "../types";
import type { ChartAnalysis } from "./index";

function deg(x: number): string {
  const d = Math.floor(x);
  const m = Math.round((x - d) * 60);
  return m === 60 ? `${d + 1}°00'` : `${d}°${String(m).padStart(2, "0")}'`;
}
function signed(n: number): string {
  return n > 0 ? `+${n}` : `${n}`;
}

export function chartHeader(chart: DeathChart): string {
  const L: string[] = [];
  L.push(`Moment (UTC): ${chart.timestampUtc}`);
  L.push(`Time known: ${chart.timeKnown ? "yes" : "no (noon assumed)"} · Location known: ${chart.locationKnown ? "yes" : "no"}`);
  L.push(`Sect: ${chart.sect.toUpperCase()} chart`);
  if (chart.ascendant) L.push(`Ascendant: ${deg(chart.ascendant.degreeInSign)} ${chart.ascendant.sign}`);
  if (chart.midheaven) L.push(`Midheaven: ${deg(chart.midheaven.degreeInSign)} ${chart.midheaven.sign}`);
  L.push(`Moon phase: ${chart.moonPhase}`);
  L.push(`Dominant element / modality: ${chart.dominantElement} / ${chart.dominantModality}`);
  L.push(`Ephemeris: ${chart.ephemeris}`);
  return L.join("\n");
}

export function analysisToText(chart: DeathChart, a: ChartAnalysis): string {
  const S: string[] = [];

  S.push("=== CHART FRAME ===");
  S.push(chartHeader(chart));

  S.push("\n=== PLANETS ===");
  for (const p of chart.planets) {
    const h = p.house != null ? ` · house ${p.house}` : "";
    const r = p.retrograde ? " · Retrograde" : "";
    S.push(`${p.name}: ${deg(p.degreeInSign)} ${p.sign}${h}${r} (speed ${p.speed.toFixed(3)}°/day)`);
  }

  S.push("\n=== ELEMENTAL / MODAL BALANCE (body counts) ===");
  S.push(`Elements — ${Object.entries(a.balance.elements).map(([k, v]) => `${k}: ${v}`).join(", ")}`);
  S.push(`Modalities — ${Object.entries(a.balance.modalities).map(([k, v]) => `${k}: ${v}`).join(", ")}`);
  S.push(`Chart shape (Jones): ${a.shape.shape} — ${a.shape.description}`);

  S.push("\n=== ESSENTIAL & ACCIDENTAL DIGNITY (Lilly point scheme) ===");
  if (a.ascendantAlmuten) {
    S.push(`Almuten of the Ascendant degree (ruler of the geniture seed): ${a.ascendantAlmuten.planet} (${a.ascendantAlmuten.score} pts at the degree)`);
  }
  for (const d of a.dignities) {
    const e = d.essential;
    const tags = [
      e.domicile && "domicile",
      e.exaltation && "exaltation",
      e.triplicity && "triplicity",
      e.term && "term",
      e.face && "face",
      e.detriment && "DETRIMENT",
      e.fall && "FALL",
      e.peregrine && "peregrine",
    ].filter(Boolean).join(", ") || "—";
    const acc = d.accidental.factors.map((f) => `${f.name} ${signed(f.points)}`).join(", ") || "—";
    S.push(`${d.planet} in ${d.sign}: essential ${signed(e.score)} [${tags}]; accidental ${signed(d.accidental.score)} [${acc}]; TOTAL ${signed(d.total)}`);
  }

  S.push("\n=== ARABIC LOTS ===");
  for (const lot of a.lots) {
    const h = lot.house != null ? `, house ${lot.house}` : "";
    S.push(`${lot.name}: ${deg(lot.degreeInSign)} ${lot.sign}${h} (ruler ${lot.ruler}) — ${lot.formula} [${lot.source}]`);
  }
  if (!a.lots.length) S.push("(insufficient data — Ascendant/8th cusp not available)");

  S.push("\n=== ASPECT PATTERNS ===");
  if (a.patterns.length) for (const pat of a.patterns) S.push(`${pat.type}: ${pat.members.join(", ")} — ${pat.description}`);
  else S.push("(no multi-body patterns detected)");

  S.push("\n=== FIXED-STAR CONTACTS (precessed to death year) ===");
  if (a.fixedStars.length) {
    for (const f of a.fixedStars) {
      S.push(`${f.star} conjunct ${f.body} (orb ${f.orb}°, mag ${f.magnitude}${f.royal ? ", ROYAL" : ""}) — ${f.keywords}`);
    }
  } else S.push("(no fixed star within orb of a body or angle)");

  S.push("\n=== DEATH-SPECIFIC COMPLEX ===");
  for (const hc of a.death.houses) {
    const parts: string[] = [`House ${hc.house} (${hc.role})`];
    if (hc.cuspSign) parts.push(`cusp in ${hc.cuspSign}`);
    if (hc.ruler) {
      const rp = hc.rulerPlacement
        ? `ruler ${hc.ruler} in ${hc.rulerPlacement.sign}${hc.rulerPlacement.house != null ? `, house ${hc.rulerPlacement.house}` : ""}${hc.rulerPlacement.retrograde ? ", Rx" : ""}`
        : `ruler ${hc.ruler}`;
      parts.push(rp);
    }
    parts.push(`occupants: ${hc.occupants.length ? hc.occupants.join(", ") : "none"}`);
    S.push(parts.join(" · "));
  }
  if (a.death.angularityUnknown) {
    S.push("NOTE: no houses/angles (time or place unknown) — house-based testimony above is limited to what signs allow.");
  }

  S.push("\nMortal significators:");
  for (const m of a.death.mortalSignificators) {
    S.push(`  ${m.name} in ${m.sign}${m.house != null ? `, house ${m.house}` : ""}${m.retrograde ? ", Rx" : ""} — ${m.note}`);
  }

  if (a.death.anaretic.length) {
    S.push("\nAnaretic / cusp degrees:");
    for (const an of a.death.anaretic) S.push(`  ${an.body} at ${deg(an.degreeInSign)} — ${an.kind}: ${an.note}`);
  }

  if (a.death.maleficContacts.length) {
    S.push("\nHard malefic contacts:");
    for (const c of a.death.maleficContacts) S.push(`  ${c.malefic} ${c.aspect} ${c.body} (orb ${c.orb}°)`);
  }

  return S.join("\n");
}
