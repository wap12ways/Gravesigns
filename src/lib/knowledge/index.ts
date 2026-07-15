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
import type { KnowledgeDocument, KnowledgeKind } from "../types";
import { getSupabase } from "../supabase";
import { NCGR_CODE_OF_ETHICS } from "./documents/ncgr-code-of-ethics";

/** Everything compiled into the app. New bundled documents are added here. */
export const BUNDLED_DOCUMENTS: KnowledgeDocument[] = [NCGR_CODE_OF_ETHICS];

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
