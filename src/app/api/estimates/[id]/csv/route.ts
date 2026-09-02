import { db } from "@/lib/supabase";
import type { Estimate, Solicitation } from "@/lib/types";

export const runtime = "nodejs";

/**
 * Line items as CSV, shaped for pasting into the OregonBuys quote form:
 * one row per line, item / description / qty / unit / unit price / extended.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = db();

  const { data: estimate } = await supabase
    .from("estimates")
    .select("*")
    .eq("id", id)
    .maybeSingle<Estimate>();
  if (!estimate) return new Response("Estimate not found", { status: 404 });

  const { data: bid } = await supabase
    .from("solicitations")
    .select("source_bid_number")
    .eq("id", estimate.solicitation_id)
    .maybeSingle<Solicitation>();

  const rows: string[][] = [
    ["Item Code", "Description", "Quantity", "Unit", "Unit Price", "Extended", "Assumptions"],
    ...(estimate.line_items ?? []).map((li) => [
      li.item_code ?? "",
      li.description,
      String(li.qty),
      li.unit,
      li.unit_price.toFixed(2),
      li.extended.toFixed(2),
      li.assumptions ?? "",
    ]),
    [],
    ["", "Subtotal", "", "", "", Number(estimate.subtotal).toFixed(2), ""],
    ["", `Markup ${estimate.markup_pct}%`, "", "", "",
      (Number(estimate.subtotal) * Number(estimate.markup_pct) / 100).toFixed(2), ""],
    ["", `Contingency ${estimate.contingency_pct}%`, "", "", "",
      (Number(estimate.subtotal) * Number(estimate.contingency_pct) / 100).toFixed(2), ""],
    ["", "TOTAL", "", "", "", Number(estimate.total).toFixed(2), ""],
  ];

  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  const fileName = `${bid?.source_bid_number ?? "estimate"}-v${estimate.version}.csv`;

  return new Response(`﻿${csv}`, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${fileName}"`,
    },
  });
}

function csvCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}
