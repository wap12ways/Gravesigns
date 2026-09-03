import { SEARCH_TERMS, type SearchTerm } from "@/config/search-terms";
import { OPEN_BIDS_URL, politeFetch, politePost } from "./fetcher";
import { parseOpenBidsList, type ListRow } from "./list";

/**
 * Searching OregonBuys, rather than skimming page one of the open-bid list.
 *
 * The list paginator is blocked, so page one — the newest 25 postings — used
 * to be the whole of our coverage. The site's own search box reaches every
 * open bid, and it works over plain HTTP once you send the `_csrf` token that
 * sits in a hidden field on the search page. Without that token the POST is
 * rejected with a 403, which is what made this look impossible at first.
 *
 * One search is two requests: a GET to mint a session, a ViewState and a CSRF
 * token, then the POST itself. At one request per 2 seconds, budget about 4
 * seconds per term.
 */

function extractHidden(html: string, name: string): string | null {
  const pattern = new RegExp(
    `name="${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^>]*value="([^"]*)"`,
  );
  return html.match(pattern)?.[1] ?? null;
}

export interface SearchOutcome {
  term: SearchTerm;
  rows: ListRow[];
  error?: string;
}

export async function searchOpenBids(term: SearchTerm): Promise<SearchOutcome> {
  // 1. Fresh page: every POST needs a matching ViewState, CSRF token and session.
  const page = await politeFetch(OPEN_BIDS_URL);
  if (page.status !== 200) {
    return { term, rows: [], error: `search page returned ${page.status}` };
  }
  const html = page.body.toString("utf8");

  const viewState = extractHidden(html, "javax.faces.ViewState");
  const csrf = extractHidden(html, "_csrf");
  if (!viewState || !csrf) {
    return { term, rows: [], error: "could not find ViewState or _csrf on the search page" };
  }

  // 2. The postback the Search button makes.
  const result = await politePost(
    OPEN_BIDS_URL,
    {
      "javax.faces.partial.ajax": "true",
      "javax.faces.source": "bidSearchForm:btnBidSearch",
      "javax.faces.partial.execute": "@all",
      "javax.faces.partial.render": "@all",
      "bidSearchForm:btnBidSearch": "bidSearchForm:btnBidSearch",
      bidSearchForm: "bidSearchForm",
      _csrf: csrf,
      "bidSearchForm:bidNbr": "",
      "bidSearchForm:alternateId": "",
      "bidSearchForm:desc": term.field === "desc" ? term.term : "",
      "bidSearchForm:itemDesc": term.field === "itemDesc" ? term.term : "",
      "javax.faces.ViewState": viewState,
    },
    page.cookie,
  );

  if (result.status !== 200) {
    return { term, rows: [], error: `search POST returned ${result.status}` };
  }

  // The partial response wraps the re-rendered page in CDATA; the results
  // table inside it is the same shape the plain GET produces.
  const { rows } = parseOpenBidsList(result.text);
  return { term, rows };
}

export interface SweepResult {
  rows: Map<string, ListRow>;
  searched: number;
  errors: { stage: string; message: string }[];
  /** True when the time budget stopped us before every term ran. */
  truncated: boolean;
}

/**
 * Run the configured searches and collect every distinct bid they surface.
 *
 * `deadline` is a wall-clock cutoff. Vercel kills a function at 300s, and a
 * run that is killed writes no scrape_runs row at all, so we stop early and
 * report honestly instead. Terms are ordered by usefulness, so a truncated
 * sweep still covers the ones that matter.
 */
export async function sweepSearches(deadline: number): Promise<SweepResult> {
  const rows = new Map<string, ListRow>();
  const errors: { stage: string; message: string }[] = [];
  let searched = 0;
  let truncated = false;

  for (const term of SEARCH_TERMS) {
    // Each term costs roughly 4s. Do not start one we cannot finish.
    if (Date.now() + 5000 > deadline) {
      truncated = true;
      break;
    }
    try {
      const outcome = await searchOpenBids(term);
      searched++;
      if (outcome.error) {
        errors.push({ stage: `search ${term.field}:${term.term}`, message: outcome.error });
        continue;
      }
      for (const row of outcome.rows) if (!rows.has(row.docId)) rows.set(row.docId, row);
    } catch (error) {
      errors.push({
        stage: `search ${term.field}:${term.term}`,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { rows, searched, errors, truncated };
}
