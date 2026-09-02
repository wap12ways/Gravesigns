import { z } from "zod";
import { CONTRACTOR_PROFILE } from "@/config/company";
import { MAX_DOC_CHARS, MODELS } from "@/config/models";
import { askClaude, fillPrompt, loadPrompt } from "./claude";
import { db } from "./supabase";
import { formatPacific } from "./time";
import type { Solicitation, SolicitationDocument } from "./types";

/**
 * Bid analysis: fit score, recommendation, and the scope the estimator prices
 * from. One Claude call per solicitation.
 */

export const AnalysisSchema = z.object({
  fit_score: z.number().min(0).max(100),
  bid_recommendation: z.enum(["bid", "review", "no_bid"]),
  reasons: z.array(z.string()),
  scope_summary: z.string(),
  scope_items: z.array(
    z.object({
      description: z.string(),
      quantity: z.number().nullable(),
      unit: z.string().nullable(),
      location: z.string().nullable(),
      material_type: z.string().nullable(),
      notes: z.string().nullable(),
    }),
  ),
  requirements: z.object({
    site_walk: z.boolean(),
    site_walk_date: z.string().nullable(),
    mandatory_pre_bid: z.boolean(),
    prevailing_wage: z.boolean(),
    bond_required: z.boolean(),
    bond_details: z.string().nullable(),
    certifications: z.array(z.string()),
    insurance: z.string().nullable(),
    questions_deadline: z.string().nullable(),
    close_at: z.string().nullable(),
  }),
  estimated_size_band: z.enum(["under 25k", "25k to 100k", "100k to 500k", "over 500k"]),
  red_flags: z.array(z.string()),
});

export type AnalysisOutput = z.infer<typeof AnalysisSchema>;

/**
 * Documents whose names suggest they carry the scope, most useful first. The
 * 60k character budget goes to these before anything else.
 */
const PRIORITY_PATTERNS = [
  /\bscope\b/i,
  /\bspecification|\bspec\b/i,
  /\bsow\b|statement of work/i,
  /\brfq\b|\brfp\b|\bitb\b|invitation to bid/i,
  /\bdrawing|\bplan\b|\bexhibit\b/i,
  /\baddend/i,
];

export function priorityRank(fileName: string): number {
  const index = PRIORITY_PATTERNS.findIndex((pattern) => pattern.test(fileName));
  return index === -1 ? PRIORITY_PATTERNS.length : index;
}

/** Concatenate document text, best documents first, capped at MAX_DOC_CHARS. */
export function buildDocumentContext(documents: SolicitationDocument[]): string {
  const usable = documents
    .filter((doc) => doc.text_extracted && doc.extracted_text)
    .sort((a, b) => priorityRank(a.file_name) - priorityRank(b.file_name));

  if (!usable.length) return "(No readable attachment text. Any PDFs are scans or were not extracted.)";

  const parts: string[] = [];
  let budget = MAX_DOC_CHARS;

  for (const doc of usable) {
    if (budget <= 0) break;
    const header = `\n\n===== ${doc.file_name} =====\n`;
    const text = doc.extracted_text!.slice(0, Math.max(0, budget - header.length));
    if (!text) break;
    const truncated = text.length < doc.extracted_text!.length;
    parts.push(header + text + (truncated ? "\n[…truncated]" : ""));
    budget -= header.length + text.length;
  }

  const omitted = usable.length - parts.length;
  if (omitted > 0) parts.push(`\n\n[${omitted} further document(s) omitted for length.]`);

  return parts.join("");
}

export async function analyzeSolicitation(solicitationId: string): Promise<AnalysisOutput> {
  const supabase = db();

  const { data: bid, error } = await supabase
    .from("solicitations")
    .select("*")
    .eq("id", solicitationId)
    .single<Solicitation>();
  if (error || !bid) throw new Error(`Solicitation ${solicitationId} not found.`);

  const { data: documents } = await supabase
    .from("solicitation_documents")
    .select("*")
    .eq("solicitation_id", solicitationId);

  const prompt = fillPrompt(loadPrompt("analysis"), {
    contractor_profile: CONTRACTOR_PROFILE,
    bid_number: bid.source_bid_number,
    title: bid.title ?? "(none)",
    agency: bid.agency ?? "(none)",
    location: bid.location_text ?? "(none)",
    county: bid.county ?? "(unknown)",
    posted_at: formatPacific(bid.posted_at, false),
    close_at: formatPacific(bid.close_at),
    nigp_codes: bid.nigp_codes?.join(", ") || "(none)",
    description: bid.description_raw ?? "(none)",
    documents: buildDocumentContext((documents ?? []) as SolicitationDocument[]),
    today: formatPacific(new Date().toISOString(), false),
  });

  const output = await askClaude({
    purpose: "analysis",
    model: MODELS.analysis,
    refId: solicitationId,
    system:
      "You are a senior estimator at an environmental abatement contractor in " +
      "Portland, Oregon. You triage public solicitations. You are direct, you " +
      "quantify what the documents support, and you never invent a quantity.",
    user: prompt,
    schema: AnalysisSchema,
  });

  const { error: insertError } = await supabase.from("solicitation_analysis").insert({
    solicitation_id: solicitationId,
    fit_score: Math.round(output.fit_score),
    bid_recommendation: output.bid_recommendation,
    reasons: output.reasons,
    scope_summary: output.scope_summary,
    scope_items: output.scope_items,
    requirements: output.requirements,
    estimated_size_band: output.estimated_size_band,
    red_flags: output.red_flags,
    model: MODELS.analysis,
  });
  if (insertError) throw new Error(`Could not save analysis: ${insertError.message}`);

  return output;
}

/** The newest analysis for a bid, or null if it has never been analysed. */
export async function latestAnalysis(solicitationId: string) {
  const { data } = await db()
    .from("solicitation_analysis")
    .select("*")
    .eq("solicitation_id", solicitationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}
