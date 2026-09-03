import { db } from "./supabase";
import type { EstimateStatus } from "./types";

/**
 * Every estimate, with the bid it belongs to.
 *
 * Joined in memory rather than through PostgREST's embedded resources — the
 * volumes are small and one plain select per table is easier to read than
 * nested select syntax.
 */

export interface EstimateListRow {
  id: string;
  version: number;
  status: EstimateStatus;
  subtotal: number;
  total: number;
  line_item_count: number;
  created_at: string;
  submitted_at: string | null;
  solicitation_id: string;
  bid_number: string | null;
  bid_title: string | null;
  agency: string | null;
  close_at: string | null;
}

export async function loadEstimates(): Promise<EstimateListRow[]> {
  const supabase = db();

  const { data: estimates } = await supabase
    .from("estimates")
    .select("id, solicitation_id, version, status, subtotal, total, line_items, created_at, submitted_at")
    .order("created_at", { ascending: false });

  if (!estimates?.length) return [];

  const { data: bids } = await supabase
    .from("solicitations")
    .select("id, source_bid_number, title, agency, close_at")
    .in("id", Array.from(new Set(estimates.map((e) => e.solicitation_id))));

  const bidById = new Map((bids ?? []).map((b) => [b.id, b]));

  return estimates.map((estimate) => {
    const bid = bidById.get(estimate.solicitation_id);
    return {
      id: estimate.id,
      version: estimate.version,
      status: estimate.status,
      subtotal: Number(estimate.subtotal),
      total: Number(estimate.total),
      line_item_count: Array.isArray(estimate.line_items) ? estimate.line_items.length : 0,
      created_at: estimate.created_at,
      submitted_at: estimate.submitted_at,
      solicitation_id: estimate.solicitation_id,
      bid_number: bid?.source_bid_number ?? null,
      bid_title: bid?.title ?? null,
      agency: bid?.agency ?? null,
      close_at: bid?.close_at ?? null,
    };
  });
}
