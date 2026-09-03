import { NextResponse } from "next/server";
import { analyzeSolicitation } from "@/lib/analysis";
import { db } from "@/lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Analyse every solicitation that has never been analysed.
 *
 * Runs in series — the analyses are independent, but firing a dozen Claude
 * calls at once is the fastest way to meet a rate limit, and the wall-clock
 * saving does not matter for a background chore.
 *
 * Stops at 240s so Vercel does not kill the request mid-analysis and lose the
 * report of what was done. Press the button again for the rest.
 */
const RUN_BUDGET_MS = 240_000;

export async function POST() {
  const deadline = Date.now() + RUN_BUDGET_MS;

  try {
    const supabase = db();

    const [{ data: bids }, { data: analysed }] = await Promise.all([
      supabase
        .from("solicitations")
        .select("id, source_bid_number, title, close_at")
        .order("close_at", { ascending: true, nullsFirst: false }),
      supabase.from("solicitation_analysis").select("solicitation_id"),
    ]);

    const done = new Set((analysed ?? []).map((row) => row.solicitation_id));
    const pending = (bids ?? []).filter((bid) => !done.has(bid.id));

    const results: { bidNumber: string; title: string | null; ok: boolean; detail: string }[] = [];
    let remaining = pending.length;

    for (const bid of pending) {
      // An analysis takes 20-60s. Do not start one we cannot finish.
      if (Date.now() + 60_000 > deadline) break;

      try {
        const analysis = await analyzeSolicitation(bid.id);
        results.push({
          bidNumber: bid.source_bid_number,
          title: bid.title,
          ok: true,
          detail: `${analysis.fit_score} · ${analysis.bid_recommendation} · ${analysis.scope_items.length} scope items`,
        });
      } catch (error) {
        results.push({
          bidNumber: bid.source_bid_number,
          title: bid.title,
          ok: false,
          detail: error instanceof Error ? error.message : String(error),
        });
      }
      remaining--;
    }

    return NextResponse.json({
      ok: true,
      analysed: results.length,
      remaining,
      results,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
