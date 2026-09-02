/**
 * Estimate arithmetic. All of it lives here, in code — the model never
 * computes a total.
 *
 * Money is rounded to cents at every step so the printed package always adds
 * up exactly. Percentages are applied to the subtotal, not compounded.
 */

import type { LineItem } from "./types";

export function round2(n: number): number {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

export function extend(qty: number, unitPrice: number): number {
  return round2((Number(qty) || 0) * (Number(unitPrice) || 0));
}

export interface Totals {
  subtotal: number;
  markup: number;
  contingency: number;
  total: number;
}

export function computeTotals(
  lineItems: Pick<LineItem, "qty" | "unit_price">[],
  markupPct: number,
  contingencyPct: number,
): Totals {
  const subtotal = round2(
    lineItems.reduce((sum, li) => sum + extend(li.qty, li.unit_price), 0),
  );
  const markup = round2(subtotal * ((Number(markupPct) || 0) / 100));
  const contingency = round2(subtotal * ((Number(contingencyPct) || 0) / 100));
  return { subtotal, markup, contingency, total: round2(subtotal + markup + contingency) };
}

export function usd(n: number | null | undefined): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(Number(n) || 0);
}

/** Normalise a raw line item off the model or the editor into a stored one. */
export function normalizeLineItem(raw: Partial<LineItem>): LineItem {
  const qty = Number(raw.qty) || 0;
  const unitPrice = Number(raw.unit_price) || 0;
  return {
    item_code: raw.item_code?.trim() || null,
    description: (raw.description ?? "").trim() || "(no description)",
    qty,
    unit: (raw.unit ?? "ls").trim(),
    unit_price: round2(unitPrice),
    extended: extend(qty, unitPrice),
    assumptions: raw.assumptions?.trim() || null,
    qty_from_docs: Boolean(raw.qty_from_docs),
  };
}
