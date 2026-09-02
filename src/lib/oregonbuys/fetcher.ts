/**
 * Every HTTP request to OregonBuys goes through here.
 *
 * Two rules the site deserves: one request every 2 seconds, and a user agent
 * that says who we are and how to reach us. The gate is a module-level promise
 * chain, so concurrent callers queue rather than burst.
 */

export const OREGONBUYS_BASE = "https://oregonbuys.gov";

export const USER_AGENT =
  "AlphaEnvironmentalBidBot/1.0 (Alpha Environmental Services LLC; bid monitoring; contact estimating@example.com)";

const MIN_INTERVAL_MS = 2000;
const REQUEST_TIMEOUT_MS = 60_000;

let gate: Promise<void> = Promise.resolve();
let lastRequestAt = 0;

/** Waits its turn, so no two requests leave less than 2s apart. */
function takeTurn(): Promise<void> {
  const wait = gate.then(async () => {
    const since = Date.now() - lastRequestAt;
    if (since < MIN_INTERVAL_MS) {
      await new Promise((r) => setTimeout(r, MIN_INTERVAL_MS - since));
    }
    lastRequestAt = Date.now();
  });
  // Keep the chain alive even if a caller's request throws.
  gate = wait.catch(() => undefined);
  return wait;
}

export interface FetchResult {
  status: number;
  body: Buffer;
  contentType: string | null;
  /** Filename from Content-Disposition, when the server sent one. */
  filename: string | null;
  url: string;
}

export async function politeFetch(url: string): Promise<FetchResult> {
  await takeTurn();

  const response = await fetch(url, {
    headers: {
      "user-agent": USER_AGENT,
      accept: "text/html,application/xhtml+xml,application/pdf,*/*",
      "accept-language": "en-US,en;q=0.9",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  const body = Buffer.from(await response.arrayBuffer());
  return {
    status: response.status,
    body,
    contentType: response.headers.get("content-type"),
    filename: filenameFromDisposition(response.headers.get("content-disposition")),
    url: response.url || url,
  };
}

export async function fetchHtml(url: string): Promise<string> {
  const result = await politeFetch(url);
  if (result.status !== 200) {
    throw new Error(`OregonBuys returned ${result.status} for ${url}`);
  }
  return result.body.toString("utf8");
}

function filenameFromDisposition(header: string | null): string | null {
  if (!header) return null;
  const quoted = header.match(/filename\*?=(?:UTF-8'')?"([^"]+)"/i);
  if (quoted) return decodeURIComponent(quoted[1]);
  const bare = header.match(/filename\*?=(?:UTF-8'')?([^;]+)/i);
  return bare ? decodeURIComponent(bare[1].trim()) : null;
}

/** `…/bidDetail.sda?docId=S-12345-00000001&external=true&parentUrl=close` */
export function bidDetailUrl(docId: string): string {
  const params = new URLSearchParams({
    docId,
    external: "true",
    parentUrl: "close",
  });
  return `${OREGONBUYS_BASE}/bso/external/bidDetail.sda?${params}`;
}

/**
 * Attachment download. The page does this with a form post, but the same
 * parameters work as a plain GET, which keeps the fetcher stateless.
 */
export function attachmentUrl(docId: string, fileNbr: string): string {
  const params = new URLSearchParams({
    mode: "download",
    bidId: docId,
    docId,
    downloadFileNbr: fileNbr,
    itemNbr: "0",
    currentPage: "1",
    parentUrl: "close",
    external: "true",
  });
  return `${OREGONBUYS_BASE}/bso/external/bidDetail.sda?${params}`;
}

export const OPEN_BIDS_URL =
  `${OREGONBUYS_BASE}/bso/view/search/external/advancedSearchBid.xhtml?openBids=true`;

/**
 * Pull the docId out of anything the user might paste: a full bid URL, a
 * search-result URL, or the bare bid number.
 */
export function extractDocId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const fromUrl = trimmed.match(/[?&]docId=([^&\s]+)/i) ?? trimmed.match(/[?&]bidId=([^&\s]+)/i);
  if (fromUrl) return decodeURIComponent(fromUrl[1]);

  // Bare bid number, e.g. S-C25102-00017907 or S-29100-00017905.
  if (/^[A-Z]-[A-Z0-9]+-\d+$/i.test(trimmed)) return trimmed.toUpperCase();

  return null;
}
