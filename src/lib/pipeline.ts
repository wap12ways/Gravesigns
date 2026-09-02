import { db } from "./supabase";
import type { BidRecommendation, EstimateStatus, SolicitationStatus } from "./types";

/**
 * The pipeline query: every solicitation with its latest analysis and latest
 * estimate, in one pass.
 *
 * Supabase's PostgREST cannot express "latest row per group", so we fetch the
 * three tables and join in memory. At prototype volumes (hundreds of bids)
 * that is fine and keeps the SQL boring.
 */

export interface PipelineRow {
  id: string;
  source_bid_number: string;
  title: string | null;
  agency: string | null;
  county: string | null;
  close_at: string | null;
  status: SolicitationStatus;
  bid_url: string | null;
  fit_score: number | null;
  bid_recommendation: BidRecommendation | null;
  estimated_size_band: string | null;
  site_walk: boolean;
  red_flag_count: number;
  estimate_status: EstimateStatus | null;
  estimate_id: string | null;
  estimate_version: number | null;
  estimate_total: number | null;
}

interface AnalysisRow {
  solicitation_id: string;
  fit_score: number | null;
  bid_recommendation: BidRecommendation | null;
  estimated_size_band: string | null;
  requirements: { site_walk?: boolean } | null;
  red_flags: string[] | null;
  created_at: string;
}

interface EstimateRow {
  id: string;
  solicitation_id: string;
  status: EstimateStatus;
  version: number;
  total: number;
}

export async function loadPipeline(): Promise<PipelineRow[]> {
  const supabase = db();

  const [{ data: bids }, { data: analyses }, { data: estimates }] = await Promise.all([
    supabase
      .from("solicitations")
      .select("id, source_bid_number, title, agency, county, close_at, status, bid_url")
      .order("close_at", { ascending: true, nullsFirst: false }),
    supabase
      .from("solicitation_analysis")
      .select(
        "solicitation_id, fit_score, bid_recommendation, estimated_size_band, requirements, red_flags, created_at",
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("estimates")
      .select("id, solicitation_id, status, version, total")
      .order("version", { ascending: false }),
  ]);

  // First row wins, and both queries are ordered newest first.
  const latestAnalysis = new Map<string, AnalysisRow>();
  for (const row of (analyses ?? []) as AnalysisRow[]) {
    if (!latestAnalysis.has(row.solicitation_id)) latestAnalysis.set(row.solicitation_id, row);
  }

  const latestEstimate = new Map<string, EstimateRow>();
  for (const row of (estimates ?? []) as EstimateRow[]) {
    if (!latestEstimate.has(row.solicitation_id)) latestEstimate.set(row.solicitation_id, row);
  }

  const rows: PipelineRow[] = (bids ?? []).map((bid) => {
    const analysis = latestAnalysis.get(bid.id);
    const estimate = latestEstimate.get(bid.id);
    return {
      id: bid.id,
      source_bid_number: bid.source_bid_number,
      title: bid.title,
      agency: bid.agency,
      county: bid.county,
      close_at: bid.close_at,
      status: bid.status,
      bid_url: bid.bid_url,
      fit_score: analysis?.fit_score ?? null,
      bid_recommendation: analysis?.bid_recommendation ?? null,
      estimated_size_band: analysis?.estimated_size_band ?? null,
      site_walk: Boolean(analysis?.requirements?.site_walk),
      red_flag_count: analysis?.red_flags?.length ?? 0,
      estimate_status: estimate?.status ?? null,
      estimate_id: estimate?.id ?? null,
      estimate_version: estimate?.version ?? null,
      estimate_total: estimate?.total ?? null,
    };
  });

  // Score first, then soonest close. Unanalysed bids sort to the bottom but
  // stay visible — an unscored bid still needs a decision.
  return rows.sort((a, b) => {
    const scoreDiff = (b.fit_score ?? -1) - (a.fit_score ?? -1);
    if (scoreDiff !== 0) return scoreDiff;
    return (a.close_at ?? "9999").localeCompare(b.close_at ?? "9999");
  });
}
