/**
 * The knowledge corpus — access layer.
 *
 * A single, generic seam through which the reading engine draws on the
 * practice's compiled reference material. Today it serves the Code of Ethics;
 * later phases add more `kind`s (association standards, articles, webinar
 * transcripts, published readings, case data) with NO change here — they are
 * just more rows in `knowledge_documents`.
 *
 * Resolution order for every read:
 *   1. Supabase `knowledge_documents` (active rows of the requested kind), when
 *      configured and the table exists.
 *   2. The bundled documents compiled into the app (always available).
 *
 * That fallback is what lets the app run in demo mode, survive a schema lag, and
 * treat the DB as the editable source of truth without ever risking a reading.
 */
import type {
  DelineationEntry,
  DeathChart,
  KnowledgeDocument,
  KnowledgeKind,
} from "../types";
import type { ChartAnalysis } from "../analysis";
import { getSupabase } from "../supabase";
import { NCGR_CODE_OF_ETHICS } from "./documents/ncgr-code-of-ethics";
import { DEATH_DELINEATIONS_DOC } from "./documents/death-delineations";
import { CLASSICAL_SOURCES_DOC } from "./documents/classical-sources";

/** Everything compiled into the app. New bundled documents are added here. */
export const BUNDLED_DOCUMENTS: KnowledgeDocument[] = [
  NCGR_CODE_OF_ETHICS,
  DEATH_DELINEATIONS_DOC,
  CLASSICAL_SOURCES_DOC,
];

function bundledByKind(kind: KnowledgeKind): KnowledgeDocument[] {
  return BUNDLED_DOCUMENTS.filter(
    (d) => d.kind === kind && (d.status ?? "active") === "active"
  );
}

interface KnowledgeRow {
  slug: string;
  kind: string;
  title: string;
  source: string | null;
  attribution: string | null;
  version: string | null;
  status: KnowledgeDocument["status"] | null;
  content: string;
  sections: KnowledgeDocument["sections"] | null;
  metadata: Record<string, unknown> | null;
}

function rowToDocument(row: KnowledgeRow): KnowledgeDocument {
  return {
    slug: row.slug,
    kind: row.kind,
    title: row.title,
    source: row.source ?? null,
    attribution: row.attribution ?? null,
    version: row.version ?? null,
    status: row.status ?? "active",
    content: row.content,
    sections: row.sections ?? undefined,
    metadata: row.metadata ?? undefined,
  };
}

/**
 * Load the active documents of a kind. Never throws — any failure (unconfigured
 * Supabase, missing table, query error, empty result) falls back to the bundled
 * copies so the engine always has its reference material.
 */
export async function loadKnowledge(
  kind: KnowledgeKind
): Promise<KnowledgeDocument[]> {
  const supabase = getSupabase();
  if (!supabase) return bundledByKind(kind);

  try {
    const { data, error } = await supabase
      .from("knowledge_documents")
      .select("*")
      .eq("kind", kind)
      .eq("status", "active")
      .order("created_at", { ascending: true });

    if (error) {
      // Missing table / column during a schema lag — fall back quietly.
      console.error("[knowledge] loadKnowledge fell back to bundled:", error.message);
      return bundledByKind(kind);
    }
    const docs = (data ?? []).map(rowToDocument);
    return docs.length ? docs : bundledByKind(kind);
  } catch (err) {
    console.error("[knowledge] loadKnowledge error, using bundled:", err);
    return bundledByKind(kind);
  }
}

/** The active code(s) of ethics the reading engine aligns against. */
export function getCodesOfEthics(): Promise<KnowledgeDocument[]> {
  return loadKnowledge("code_of_ethics");
}

/**
 * The short, composition-time distillation for a set of ethics documents. Falls
 * back to the full content when a document carries no `operating_summary`.
 */
export function operatingSummary(docs: KnowledgeDocument[]): string {
  return docs
    .map((d) => {
      const s = d.metadata?.operating_summary;
      return typeof s === "string" && s.trim() ? s.trim() : d.content;
    })
    .join("\n\n");
}

/** A code's short label for citations, e.g. "NCGR". Defaults to the slug. */
export function codeLabel(doc: KnowledgeDocument): string {
  const label = doc.metadata?.code_label;
  return typeof label === "string" && label.trim() ? label.trim() : doc.slug;
}

// ── Delineation corpus: retrieval ───────────────────────────────────────────
// The interpretive layer. Delineation documents (kind `delineation`) carry a
// factor-keyed array of entries in `metadata.entries`. We load them through the
// same Supabase-with-bundled-fallback seam, then select ONLY the entries whose
// key matches a factor actually present in the chart — so the composer gets
// targeted depth, never the whole corpus.

/** Load the active delineation documents (Supabase override, bundled fallback). */
export function getDelineations(): Promise<KnowledgeDocument[]> {
  return loadKnowledge("delineation");
}

/** Flatten the `metadata.entries` of a set of delineation documents. */
export function delineationEntries(docs: KnowledgeDocument[]): DelineationEntry[] {
  const out: DelineationEntry[] = [];
  for (const d of docs) {
    const entries = d.metadata?.entries;
    if (Array.isArray(entries)) {
      for (const e of entries) {
        if (e && typeof e.key === "string" && typeof e.body === "string") {
          out.push(e as DelineationEntry);
        }
      }
    }
  }
  return out;
}

/**
 * The set of factor keys actually present in a given chart + analysis. These are
 * the tokens a delineation entry's `key` is matched against. Kept deterministic
 * and dependency-light: it reads only the computed frame, never the ephemeris.
 */
export function activeFactorKeys(chart: DeathChart, analysis: ChartAnalysis): Set<string> {
  const keys = new Set<string>();

  const moon = chart.planets.find((p) => p.name === "Moon");
  if (moon) keys.add(`moon:${moon.sign}`);
  const sun = chart.planets.find((p) => p.name === "Sun");
  if (sun) keys.add(`sun:${sun.sign}`);

  if (chart.moonPhase) keys.add(`phase:${chart.moonPhase}`);
  keys.add(`sect:${chart.sect}`);
  if (chart.dominantElement) keys.add(`element:${chart.dominantElement}`);
  if (chart.dominantModality) keys.add(`modality:${chart.dominantModality}`);
  if (analysis.shape?.shape) keys.add(`shape:${analysis.shape.shape}`);

  for (const m of analysis.death.mortalSignificators) keys.add(`significator:${m.name}`);
  // The lunar nodes ride the chart's planet list under various labels.
  if (chart.planets.some((p) => /node/i.test(p.name))) keys.add("significator:Nodes");

  // The Ruling Hand: the governor of the chart — the almuten of the Ascendant
  // degree (present only when angles are known). One classical planet.
  if (analysis.ascendantAlmuten?.planet) {
    keys.add(`ruler:${analysis.ascendantAlmuten.planet}`);
  }

  // Aspect patterns detected across the bodies (stellium, T-square, …).
  for (const pat of analysis.patterns) keys.add(`pattern:${pat.type}`);

  // Benefic soft contacts (trine/sextile) from Jupiter/Venus to a luminary —
  // read straight from the computed aspect list.
  const SOFT = new Set(["Trine", "Sextile"]);
  const LUMINARIES = new Set(["Sun", "Moon"]);
  for (const a of chart.aspects) {
    if (!SOFT.has(a.type)) continue;
    for (const benefic of ["Jupiter", "Venus"] as const) {
      const touchesBenefic = a.a === benefic || a.b === benefic;
      const other = a.a === benefic ? a.b : a.a;
      if (touchesBenefic && LUMINARIES.has(other)) keys.add(`aspect:${benefic}-soft`);
    }
  }

  // Planetary condition (dignity), read only for the bodies that carry a death
  // chart — the luminaries and the mortal significators — and only for the
  // notable conditions, so the reference stays meaningful rather than noisy.
  const CONDITION_BODIES = new Set([
    "Sun",
    "Moon",
    "Saturn",
    "Mars",
    "Pluto",
  ]);
  for (const d of analysis.dignities) {
    if (!CONDITION_BODIES.has(d.planet)) continue;
    const e = d.essential;
    if (e.domicile) keys.add("dignity:domicile");
    if (e.exaltation) keys.add("dignity:exaltation");
    if (e.detriment) keys.add("dignity:detriment");
    if (e.fall) keys.add("dignity:fall");
    if (e.peregrine) keys.add("dignity:peregrine");
  }

  // Hard contacts from the malefics to a luminary or angle — surfaced per malefic.
  for (const c of analysis.death.maleficContacts) {
    if (c.malefic === "Saturn" || c.malefic === "Mars" || c.malefic === "Pluto") {
      keys.add(`aspect:${c.malefic}-hard`);
    }
  }

  for (const h of analysis.death.houses) keys.add(`house:${h.house}`);

  for (const lot of analysis.lots) {
    if (/^Part of Fortune/.test(lot.name)) keys.add("lot:Part of Fortune");
    if (/^Lot of Death/.test(lot.name)) keys.add("lot:Lot of Death");
  }

  for (const f of analysis.fixedStars) keys.add(`star:${f.star}`);

  return keys;
}

/** Priority order when trimming to a bounded set — spine factors lead. */
const FAMILY_RANK: Record<DelineationEntry["family"], number> = {
  moon: 0,
  phase: 1,
  ruler: 2,
  significator: 3,
  dignity: 4,
  aspect: 5,
  pattern: 6,
  house: 7,
  lot: 8,
  star: 9,
  shape: 10,
  sun: 11,
  element: 12,
  modality: 13,
  sect: 14,
};

/**
 * Select the delineation entries whose key matches a factor in this chart,
 * de-duplicated by key and ranked so the interpretive spine (Moon, phase,
 * significators, the death houses) comes first. Capped to keep the composition
 * prompt bounded. Never throws — an empty corpus just yields no reference.
 */
export async function selectDelineations(
  chart: DeathChart,
  analysis: ChartAnalysis,
  opts: { limit?: number } = {}
): Promise<DelineationEntry[]> {
  const limit = opts.limit ?? 26;
  const docs = await getDelineations();
  const all = delineationEntries(docs);
  if (!all.length) return [];

  const active = activeFactorKeys(chart, analysis);
  const seen = new Set<string>();
  const matched = all.filter((e) => {
    if (!active.has(e.key) || seen.has(e.key)) return false;
    seen.add(e.key);
    return true;
  });

  matched.sort(
    (a, b) => (FAMILY_RANK[a.family] ?? 99) - (FAMILY_RANK[b.family] ?? 99)
  );
  return matched.slice(0, limit);
}

/**
 * Render selected delineations into the Markdown reference block folded into the
 * composition pass. Grouped by family with light headers; every body is doctrine
 * to SYNTHESIZE, never to quote.
 */
export function delineationBrief(entries: DelineationEntry[]): string {
  if (!entries.length) return "";
  const FAMILY_HEADING: Record<DelineationEntry["family"], string> = {
    moon: "The Soul's Vehicle — the Moon",
    phase: "The Lunar Phase",
    ruler: "The Ruling Hand",
    significator: "The Mortal Significators & Karmic Axis",
    dignity: "Planetary Condition (Dignity)",
    aspect: "Aspect Contacts",
    pattern: "Aspect Patterns",
    house: "The Death-House Complex (8th · 4th · 12th)",
    lot: "The Lots",
    star: "Fixed-Star Contacts",
    shape: "The Shape of the Whole",
    sun: "The Luminary — the Sun",
    element: "The Elemental Cast",
    modality: "The Modal Cast",
    sect: "The Sect of the Chart",
  };

  const order = Object.keys(FAMILY_RANK) as DelineationEntry["family"][];
  const byFamily = new Map<DelineationEntry["family"], DelineationEntry[]>();
  for (const e of entries) {
    const list = byFamily.get(e.family) ?? [];
    list.push(e);
    byFamily.set(e.family, list);
  }

  const blocks: string[] = [];
  for (const fam of order) {
    const list = byFamily.get(fam);
    if (!list?.length) continue;
    blocks.push(`### ${FAMILY_HEADING[fam]}`);
    for (const e of list) {
      const src = e.source ? ` _(tradition: ${e.source})_` : "";
      blocks.push(`- **${e.title}** — ${e.body}${src}`);
    }
  }
  return blocks.join("\n");
}
