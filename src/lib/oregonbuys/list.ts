import * as cheerio from "cheerio";
import { fetchHtml, OPEN_BIDS_URL } from "./fetcher";

/**
 * The open-bids list.
 *
 * The results table renders server side on a plain GET — 25 rows, newest bid
 * number first, no ViewState needed. Pagination is a different story: the
 * PrimeFaces paginator postback is rejected with a 403 by whatever sits in
 * front of the app, even with a live ViewState, a session cookie and full
 * browser headers. So this reads page one and nothing else.
 *
 * That is enough. OregonBuys posts a handful of bids a day; 25 per 4-hour
 * sweep is a wide margin, and anything that does slip past is caught by
 * manual import on /admin.
 *
 * `ListStrategy` exists so a Playwright-driven full sweep can be added later
 * without the rest of the pipeline noticing.
 */

export interface ListRow {
  docId: string;
  bidNumber: string;
  agency: string | null;
  buyerName: string | null;
  title: string | null;
  /** As printed, e.g. "10/14/2026 15:00:00". Authoritative dates come from the detail page. */
  closeAtText: string | null;
  alternateId: string | null;
}

export interface ListStrategy {
  name: string;
  fetchOpenBids(): Promise<{ rows: ListRow[]; totalReported: number | null }>;
}

export function parseOpenBidsList(html: string): {
  rows: ListRow[];
  totalReported: number | null;
} {
  const $ = cheerio.load(html);
  const rows: ListRow[] = [];

  $("tbody[id$='bidResultId_data'] tr[data-ri]").each((_, tr) => {
    const cells = $(tr).find("td");
    const href = $(tr).find("a[href*='bidDetail.sda']").first().attr("href") ?? "";
    const docId = href.match(/docId=([^&"']+)/)?.[1];
    if (!docId) return;

    const text = (index: number) => {
      const value = $(cells[index]).text().replace(/ /g, " ").trim();
      return value || null;
    };

    rows.push({
      docId: decodeURIComponent(docId),
      bidNumber: text(0) ?? docId,
      agency: text(2),
      buyerName: text(5),
      title: text(6),
      closeAtText: text(7),
      alternateId: text(11),
    });
  });

  // "1-25 of 176"
  const paginator = $("[id$='_paginator_bottom'] .ui-paginator-current").first().text();
  const total = paginator.match(/of\s+([\d,]+)/)?.[1];

  return {
    rows,
    totalReported: total ? Number(total.replace(/,/g, "")) : null,
  };
}

/** Plain fetch + cheerio. The default, and the only one wired up today. */
export const fetchListStrategy: ListStrategy = {
  name: "fetch",
  async fetchOpenBids() {
    return parseOpenBidsList(await fetchHtml(OPEN_BIDS_URL));
  },
};
