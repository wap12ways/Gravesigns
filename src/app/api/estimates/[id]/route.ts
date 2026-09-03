import { NextResponse } from "next/server";
import { computeTotals, normalizeLineItem } from "@/lib/money";
import { db } from "@/lib/supabase";
import type { InclusionRow, LineItem } from "@/lib/types";

export const runtime = "nodejs";

/**
 * Save an edited estimate. Totals are always recomputed here — whatever the
 * client sends for subtotal or total is ignored.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    line_items?: Partial<LineItem>[];
    inclusions?: InclusionRow[];
    markup_pct?: number;
    contingency_pct?: number;
    assumptions?: string;
    exclusions?: string;
    narrative?: string;
    status?: "draft" | "reviewed" | "submitted";
  };

  const supabase = db();
  const { data: current, error: loadError } = await supabase
    .from("estimates")
    .select("*")
    .eq("id", id)
    .single();
  if (loadError || !current) {
    return NextResponse.json({ error: "Estimate not found." }, { status: 404 });
  }

  const lineItems = (body.line_items ?? current.line_items ?? []).map(normalizeLineItem);
  const markupPct = body.markup_pct ?? Number(current.markup_pct);
  const contingencyPct = body.contingency_pct ?? Number(current.contingency_pct);
  const totals = computeTotals(lineItems, markupPct, contingencyPct);

  const update: Record<string, unknown> = {
    line_items: lineItems,
    markup_pct: markupPct,
    contingency_pct: contingencyPct,
    subtotal: totals.subtotal,
    total: totals.total,
  };
  if (body.inclusions !== undefined) update.inclusions = body.inclusions;
  if (body.assumptions !== undefined) update.assumptions = body.assumptions;
  if (body.exclusions !== undefined) update.exclusions = body.exclusions;
  if (body.narrative !== undefined) update.narrative = body.narrative;
  if (body.status !== undefined) {
    update.status = body.status;
    update.submitted_at =
      body.status === "submitted" ? (current.submitted_at ?? new Date().toISOString()) : null;
  }

  const { data: saved, error } = await supabase
    .from("estimates")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, estimate: saved, totals });
}
