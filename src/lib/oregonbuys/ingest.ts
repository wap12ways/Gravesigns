import { db } from "@/lib/supabase";
import { matchesKeywords, matchesNigp } from "@/config/filters";
import { parseBidDetail, type ParsedBid } from "./detail";
import { fetchDocuments, type DocumentResult } from "./documents";
import { bidDetailUrl, fetchHtml } from "./fetcher";

/**
 * One bid, end to end: fetch the detail page, parse it, upsert the
 * solicitation, then pull down its attachments.
 *
 * Used by both the manual import on /admin and the cron scraper, so the two
 * paths can never drift apart.
 */

export interface IngestResult {
  docId: string;
  solicitationId: string | null;
  bidNumber: string;
  title: string | null;
  isNew: boolean;
  matched: boolean;
  matchReasons: string[];
  documents: DocumentResult[];
  skippedReason?: string;
}

export interface IngestOptions {
  /**
   * Manual imports store the bid whether or not it matches the keyword filter —
   * if the operator pasted the URL, they want it. The scraper does not.
   */
  applyFilter: boolean;
  importSource: "scraper" | "manual";
  /** Skip the attachment download (used when only refreshing metadata). */
  skipDocuments?: boolean;
}

export async function ingestBid(docId: string, options: IngestOptions): Promise<IngestResult> {
  const html = await fetchHtml(bidDetailUrl(docId));
  const bid = parseBidDetail(html, docId);
  return storeBid(bid, docId, options);
}

export async function storeBid(
  bid: ParsedBid,
  docId: string,
  options: IngestOptions,
): Promise<IngestResult> {
  const supabase = db();

  const keywordHits = matchesKeywords(bid.title, bid.descriptionRaw);
  const nigpHits = matchesNigp(bid.nigpCodes);
  const matchReasons = [
    ...keywordHits.map((k) => `keyword: ${k}`),
    ...nigpHits.map((c) => `NIGP: ${c}`),
  ];
  const matched = matchReasons.length > 0;

  const base: IngestResult = {
    docId,
    solicitationId: null,
    bidNumber: bid.sourceBidNumber,
    title: bid.title,
    isNew: false,
    matched,
    matchReasons,
    documents: [],
  };

  if (options.applyFilter && !matched) {
    return { ...base, skippedReason: "no keyword or NIGP match" };
  }

  const { data: existing } = await supabase
    .from("solicitations")
    .select("id, raw_html_hash")
    .eq("source_bid_number", bid.sourceBidNumber)
    .maybeSingle();

  const now = new Date().toISOString();
  const row = {
    source_bid_number: bid.sourceBidNumber,
    title: bid.title,
    agency: bid.agency,
    buyer_name: bid.buyerName,
    buyer_email: bid.buyerEmail,
    posted_at: bid.postedAt,
    close_at: bid.closeAt,
    bid_url: bid.bidUrl,
    description_raw: bid.descriptionRaw,
    nigp_codes: bid.nigpCodes,
    location_text: bid.locationText,
    county: bid.county,
    raw_html_hash: bid.rawHtmlHash,
    last_seen_at: now,
    // A bid past its opening date is closed, whatever the list still says.
    status: bid.closeAt && new Date(bid.closeAt) < new Date() ? "closed" : "open",
  };

  // scraped_at and import_source record how the bid first arrived, so they are
  // only written on insert.
  const payload: Record<string, unknown> = { ...row };
  if (!existing) {
    payload.scraped_at = now;
    payload.import_source = options.importSource;
  }

  const { data: saved, error } = await supabase
    .from("solicitations")
    .upsert(payload, { onConflict: "source_bid_number" })
    .select("id")
    .single();

  if (error) throw new Error(`Could not save solicitation: ${error.message}`);

  const result: IngestResult = {
    ...base,
    solicitationId: saved.id,
    isNew: !existing,
  };

  if (options.skipDocuments) return result;

  result.documents = await fetchDocuments(saved.id, bid.sourceBidNumber, docId, bid.attachments);
  return result;
}
