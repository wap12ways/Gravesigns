import { matchesKeywords, matchesNigp } from "@/config/filters";
import { db } from "@/lib/supabase";
import { parseBidDetail } from "./detail";
import { bidDetailUrl, fetchHtml } from "./fetcher";
import { fetchListStrategy, type ListStrategy } from "./list";
import { sweepSearches } from "./search";
import { storeBid } from "./ingest";

/**
 * The scrape run.
 *
 * Deliberately a plain module with one exported async function and no Next.js
 * imports, so it can be dropped into an AWS Lambda handler unchanged if the
 * work ever outgrows a Vercel function:
 *
 *   exports.handler = async () => runScrape({ trigger: "cron" });
 */

/**
 * Wall-clock budget for one run. Vercel terminates a function at 300s and a
 * killed run leaves its scrape_runs row open forever, so we stop at 240s and
 * write an honest record instead. Anything not reached is picked up next run —
 * scrape_seen means nothing is re-examined for free.
 */
const RUN_BUDGET_MS = 240_000;

export interface ScrapeSummary {
  runId: string | null;
  bids_seen: number;
  bids_matched: number;
  bids_new: number;
  bids_closed: number;
  docs_fetched: number;
  errors: { stage: string; message: string }[];
  ok: boolean;
}

export interface ScrapeOptions {
  trigger: "cron" | "manual";
  strategy?: ListStrategy;
}

export async function runScrape(options: ScrapeOptions): Promise<ScrapeSummary> {
  const supabase = db();
  const strategy = options.strategy ?? fetchListStrategy;
  const errors: { stage: string; message: string }[] = [];

  const { data: run } = await supabase
    .from("scrape_runs")
    .insert({ trigger: options.trigger })
    .select("id")
    .single();
  const runId: string | null = run?.id ?? null;

  const deadline = Date.now() + RUN_BUDGET_MS;

  const summary: ScrapeSummary = {
    runId,
    bids_seen: 0,
    bids_matched: 0,
    bids_new: 0,
    bids_closed: 0,
    docs_fetched: 0,
    errors,
    ok: false,
  };

  try {
    // Two sources, deduped. The searches reach every open bid on the site;
    // page one of the list is a cheap backstop that also catches a brand-new
    // posting whose wording none of our search terms happens to hit.
    const sweep = await sweepSearches(deadline);
    errors.push(...sweep.errors);
    if (sweep.truncated) {
      errors.push({
        stage: "search",
        message: `time budget reached after ${sweep.searched} searches; the rest run next time`,
      });
    }

    const byDocId = new Map(sweep.rows);
    try {
      const listing = await strategy.fetchOpenBids();
      for (const row of listing.rows) if (!byDocId.has(row.docId)) byDocId.set(row.docId, row);
    } catch (error) {
      errors.push({
        stage: "open bids list",
        message: error instanceof Error ? error.message : String(error),
      });
    }

    const rows = [...byDocId.values()];
    summary.bids_seen = rows.length;

    const bidNumbers = rows.map((r) => r.bidNumber);

    // Which of these have we already pulled the detail page for, and what did
    // we conclude? A bid we looked at and rejected does not need looking at
    // again — that is the whole job of scrape_seen.
    const [{ data: tracked }, { data: seen }] = await Promise.all([
      supabase.from("solicitations").select("source_bid_number").in("source_bid_number", bidNumbers),
      supabase.from("scrape_seen").select("source_bid_number, matched").in("source_bid_number", bidNumbers),
    ]);

    const trackedNumbers = new Set((tracked ?? []).map((row) => row.source_bid_number));
    const rejectedBefore = new Set(
      (seen ?? []).filter((row) => !row.matched).map((row) => row.source_bid_number),
    );

    for (const row of rows) {
      if (Date.now() > deadline) {
        errors.push({
          stage: "bids",
          message: "time budget reached; remaining bids are picked up on the next run",
        });
        break;
      }
      try {
        // The list row carries a title. If it matches, we already know we want
        // the detail page. If it does not, we still want the detail page the
        // first time — titles are terse and the real description and NIGP
        // codes only live on the detail page. What we skip is the third,
        // fourth and hundredth look at a bid we already decided against.
        const titleMatches = matchesKeywords(row.title).length > 0;
        if (!titleMatches && !trackedNumbers.has(row.bidNumber) && rejectedBefore.has(row.bidNumber)) {
          await touchSeen(row.bidNumber, row.docId, false);
          continue;
        }

        const html = await fetchHtml(bidDetailUrl(row.docId));
        const bid = parseBidDetail(html, row.docId);

        const matched =
          matchesKeywords(bid.title, bid.descriptionRaw).length > 0 ||
          matchesNigp(bid.nigpCodes).length > 0;

        await touchSeen(bid.sourceBidNumber, row.docId, matched);

        if (!matched && !trackedNumbers.has(bid.sourceBidNumber)) continue;

        summary.bids_matched++;
        const result = await storeBid(bid, row.docId, {
          // A bid we already track stays tracked even if a later edit drops the
          // keyword; the operator may already be working it.
          applyFilter: false,
          importSource: "scraper",
        });

        if (result.isNew) summary.bids_new++;
        summary.docs_fetched += result.documents.filter((d) => d.status === "stored").length;
      } catch (error) {
        errors.push({
          stage: `bid ${row.bidNumber}`,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    summary.bids_closed = await closeStaleBids();
    summary.ok = errors.length === 0;
  } catch (error) {
    errors.push({
      stage: "list",
      message: error instanceof Error ? error.message : String(error),
    });
    summary.ok = false;
  }

  if (runId) {
    await supabase
      .from("scrape_runs")
      .update({
        finished_at: new Date().toISOString(),
        bids_seen: summary.bids_seen,
        bids_matched: summary.bids_matched,
        bids_new: summary.bids_new,
        bids_closed: summary.bids_closed,
        docs_fetched: summary.docs_fetched,
        errors,
        ok: summary.ok,
      })
      .eq("id", runId);
  }

  return summary;
}

/** Record that we have evaluated this bid number, and what we concluded. */
async function touchSeen(bidNumber: string, docId: string, matched: boolean): Promise<void> {
  await db()
    .from("scrape_seen")
    .upsert(
      { source_bid_number: bidNumber, doc_id: docId, matched, last_seen_at: new Date().toISOString() },
      { onConflict: "source_bid_number" },
    );
}

/**
 * Close bids whose opening date has passed.
 *
 * Note what this does NOT do: mark a bid closed merely because it is absent
 * from a run. Coverage depends on which search terms a bid's wording happens
 * to hit, so absence proves nothing. The date is the honest signal.
 */
async function closeStaleBids(): Promise<number> {
  const { data, error } = await db()
    .from("solicitations")
    .update({ status: "closed" })
    .eq("status", "open")
    .lt("close_at", new Date().toISOString())
    .select("id");

  if (error) throw new Error(`Could not close past-due bids: ${error.message}`);
  return data?.length ?? 0;
}
