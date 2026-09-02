import { z } from "zod";
import { COMPANY, CONTRACTOR_PROFILE, ESTIMATE_DEFAULTS } from "@/config/company";
import { MODELS } from "@/config/models";
import { askClaude, askClaudeText, fillPrompt, loadPrompt } from "./claude";
import { computeTotals, normalizeLineItem, usd } from "./money";
import { db } from "./supabase";
import { formatPacific } from "./time";
import type {
  Estimate,
  LineItem,
  ScopeItem,
  Solicitation,
  SolicitationAnalysis,
  UnitPrice,
} from "./types";

/**
 * Estimate generation.
 *
 * Claude maps the extracted scope onto the unit price book and proposes
 * quantities. Every number that matters — extended amounts, subtotal, markup,
 * contingency, total — is computed here in code from that output.
 */

const GeneratedSchema = z.object({
  line_items: z.array(
    z.object({
      item_code: z.string(),
      description: z.string(),
      qty: z.number(),
      unit: z.string(),
      assumptions: z.string().nullable(),
      qty_from_docs: z.boolean(),
    }),
  ),
  assumptions: z.array(z.string()),
  exclusions: z.array(z.string()),
});

export async function generateEstimate(solicitationId: string): Promise<Estimate> {
  const supabase = db();

  const { data: bid, error: bidError } = await supabase
    .from("solicitations")
    .select("*")
    .eq("id", solicitationId)
    .single<Solicitation>();
  if (bidError || !bid) throw new Error("Solicitation not found.");

  const { data: analysis } = await supabase
    .from("solicitation_analysis")
    .select("*")
    .eq("solicitation_id", solicitationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<SolicitationAnalysis>();

  if (!analysis) {
    throw new Error("Analyse this bid before generating an estimate.");
  }

  const { data: priceRows } = await supabase
    .from("unit_prices")
    .select("*")
    .eq("active", true)
    .order("category")
    .order("item_code");

  const prices = (priceRows ?? []) as UnitPrice[];
  if (!prices.length) {
    throw new Error("The unit price book is empty. Run supabase/seed/unit_prices.sql.");
  }
  const priceByCode = new Map(prices.map((p) => [p.item_code, p]));

  // ── ask Claude for line items ────────────────────────────────────────────
  const generated = await askClaude({
    purpose: "estimate",
    model: MODELS.estimate,
    refId: solicitationId,
    system:
      "You are a senior estimator at an environmental abatement contractor. You " +
      "price from a fixed unit price book, you never invent an item code, and " +
      "you never do arithmetic — the application computes every total.",
    user: fillPrompt(loadPrompt("estimate"), {
      contractor_profile: CONTRACTOR_PROFILE,
      bid_number: bid.source_bid_number,
      title: bid.title ?? "(none)",
      agency: bid.agency ?? "(none)",
      county: bid.county ?? "(unknown)",
      close_at: formatPacific(bid.close_at),
      scope_summary: analysis.scope_summary ?? "(none)",
      scope_items: formatScopeItems((analysis.scope_items ?? []) as ScopeItem[]),
      requirements: JSON.stringify(analysis.requirements ?? {}, null, 2),
      red_flags: (analysis.red_flags ?? []).map((f) => `- ${f}`).join("\n") || "(none)",
      unit_prices: formatPriceBook(prices),
    }),
    schema: GeneratedSchema,
  });

  // ── turn it into line items, pricing from our own book ───────────────────
  const rejected: string[] = [];
  const lineItems: LineItem[] = [];

  for (const raw of generated.line_items) {
    const price = priceByCode.get(raw.item_code.trim());
    if (!price) {
      // The model referenced a code we do not have. Drop the line and say so
      // rather than quietly pricing it at zero.
      rejected.push(raw.item_code);
      continue;
    }
    lineItems.push(
      normalizeLineItem({
        item_code: price.item_code,
        description: raw.description || price.description,
        qty: raw.qty,
        unit: price.unit,
        unit_price: Number(price.unit_price),
        assumptions: raw.assumptions,
        qty_from_docs: raw.qty_from_docs,
      }),
    );
  }

  const assumptions = [...generated.assumptions];
  if (rejected.length) {
    assumptions.push(
      `Dropped ${rejected.length} proposed line item(s) referencing unknown price codes: ${rejected.join(", ")}.`,
    );
  }

  const totals = computeTotals(
    lineItems,
    ESTIMATE_DEFAULTS.markupPct,
    ESTIMATE_DEFAULTS.contingencyPct,
  );

  // ── next version number ──────────────────────────────────────────────────
  const { data: previous } = await supabase
    .from("estimates")
    .select("version")
    .eq("solicitation_id", solicitationId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  const version = (previous?.version ?? 0) + 1;

  const assumptionsText = assumptions.map((a) => `• ${a}`).join("\n");
  const exclusionsText = generated.exclusions.map((e) => `• ${e}`).join("\n");

  // ── cover letter ─────────────────────────────────────────────────────────
  let narrative: string | null = null;
  try {
    narrative = await askClaudeText({
      purpose: "narrative",
      model: MODELS.narrative,
      refId: solicitationId,
      system:
        "You write plain, credible cover letters for a Portland environmental " +
        "abatement contractor bidding public work. No marketing language, no " +
        "claims you cannot support.",
      user: fillPrompt(loadPrompt("narrative"), {
        company_name: COMPANY.legalName,
        signer_name: COMPANY.signer.name,
        signer_title: COMPANY.signer.title,
        bid_number: bid.source_bid_number,
        title: bid.title ?? "(none)",
        agency: bid.agency ?? "(none)",
        buyer_name: bid.buyer_name ?? "(none)",
        close_at: formatPacific(bid.close_at),
        scope_summary: analysis.scope_summary ?? "(none)",
        line_item_summary: lineItems
          .map((li) => `- ${li.description} — ${li.qty} ${li.unit}`)
          .join("\n"),
        total: usd(totals.total),
        assumptions: assumptionsText || "(none)",
        exclusions: exclusionsText || "(none)",
      }),
      maxTokens: 2000,
      effort: "medium",
    });
  } catch (error) {
    // A missing cover letter must not lose the priced estimate. It is editable
    // on the estimate page and regenerable from there.
    console.error("[estimate] narrative failed", error);
  }

  const { data: saved, error: saveError } = await supabase
    .from("estimates")
    .insert({
      solicitation_id: solicitationId,
      version,
      status: "draft",
      line_items: lineItems,
      subtotal: totals.subtotal,
      markup_pct: ESTIMATE_DEFAULTS.markupPct,
      contingency_pct: ESTIMATE_DEFAULTS.contingencyPct,
      total: totals.total,
      assumptions: assumptionsText || null,
      exclusions: exclusionsText || null,
      narrative,
      model: MODELS.estimate,
    })
    .select("*")
    .single<Estimate>();

  if (saveError || !saved) {
    throw new Error(`Could not save estimate: ${saveError?.message ?? "unknown error"}`);
  }
  return saved;
}

/** Regenerate just the cover letter for an existing estimate. */
export async function regenerateNarrative(estimateId: string): Promise<string> {
  const supabase = db();

  const { data: estimate, error } = await supabase
    .from("estimates")
    .select("*")
    .eq("id", estimateId)
    .single<Estimate>();
  if (error || !estimate) throw new Error("Estimate not found.");

  const { data: bid } = await supabase
    .from("solicitations")
    .select("*")
    .eq("id", estimate.solicitation_id)
    .single<Solicitation>();

  const { data: analysis } = await supabase
    .from("solicitation_analysis")
    .select("scope_summary")
    .eq("solicitation_id", estimate.solicitation_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const narrative = await askClaudeText({
    purpose: "narrative",
    model: MODELS.narrative,
    refId: estimateId,
    system:
      "You write plain, credible cover letters for a Portland environmental " +
      "abatement contractor bidding public work. No marketing language.",
    user: fillPrompt(loadPrompt("narrative"), {
      company_name: COMPANY.legalName,
      signer_name: COMPANY.signer.name,
      signer_title: COMPANY.signer.title,
      bid_number: bid?.source_bid_number ?? "(unknown)",
      title: bid?.title ?? "(none)",
      agency: bid?.agency ?? "(none)",
      buyer_name: bid?.buyer_name ?? "(none)",
      close_at: formatPacific(bid?.close_at),
      scope_summary: analysis?.scope_summary ?? "(none)",
      line_item_summary: (estimate.line_items ?? [])
        .map((li) => `- ${li.description} — ${li.qty} ${li.unit}`)
        .join("\n"),
      total: usd(estimate.total),
      assumptions: estimate.assumptions ?? "(none)",
      exclusions: estimate.exclusions ?? "(none)",
    }),
    maxTokens: 2000,
    effort: "medium",
  });

  await supabase.from("estimates").update({ narrative }).eq("id", estimateId);
  return narrative;
}

function formatScopeItems(items: ScopeItem[]): string {
  if (!items.length) {
    return "(No scope items were extracted — the bid documents did not contain a priced scope.)";
  }
  return items
    .map((item, i) => {
      const parts = [
        `${i + 1}. ${item.description}`,
        `   quantity: ${item.quantity ?? "NOT STATED IN DOCUMENTS"}${item.unit ? ` ${item.unit}` : ""}`,
      ];
      if (item.material_type) parts.push(`   material: ${item.material_type}`);
      if (item.location) parts.push(`   location: ${item.location}`);
      if (item.notes) parts.push(`   notes: ${item.notes}`);
      return parts.join("\n");
    })
    .join("\n\n");
}

function formatPriceBook(prices: UnitPrice[]): string {
  const byCategory = new Map<string, UnitPrice[]>();
  for (const price of prices) {
    const list = byCategory.get(price.category) ?? [];
    list.push(price);
    byCategory.set(price.category, list);
  }

  return Array.from(byCategory.entries())
    .map(([category, items]) => {
      const rows = items
        .map(
          (p) =>
            `| ${p.item_code} | ${p.description} | ${p.unit} | ${Number(p.unit_price).toFixed(2)} |`,
        )
        .join("\n");
      return `## ${category}\n\n| item_code | description | unit | unit_price |\n| --- | --- | --- | --- |\n${rows}`;
    })
    .join("\n\n");
}
