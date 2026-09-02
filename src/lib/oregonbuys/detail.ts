import * as cheerio from "cheerio";
import crypto from "node:crypto";
import { parseOregonDate } from "@/lib/time";
import { bidDetailUrl } from "./fetcher";

/**
 * Parses an OregonBuys bid detail page.
 *
 * The page is a BuySpeed label/value table: every field is a `td.t-head-01`
 * holding the label, with the value in the very next `td`. Rather than write a
 * selector per field, we build one label → value map and read from it. New
 * fields the site adds show up in the map for free.
 */

export interface ParsedAttachment {
  /** BuySpeed's internal file number, used to build the download URL. */
  fileNbr: string;
  fileName: string;
}

export interface ParsedBid {
  sourceBidNumber: string;
  title: string | null;
  agency: string | null;
  buyerName: string | null;
  buyerEmail: string | null;
  postedAt: string | null;
  closeAt: string | null;
  bidUrl: string;
  descriptionRaw: string | null;
  nigpCodes: string[];
  locationText: string | null;
  county: string | null;
  attachments: ParsedAttachment[];
  rawHtmlHash: string;
  /** Everything the label map found, kept for debugging in /admin. */
  fields: Record<string, string>;
}

const OREGON_COUNTIES = [
  "Baker", "Benton", "Clackamas", "Clatsop", "Columbia", "Coos", "Crook",
  "Curry", "Deschutes", "Douglas", "Gilliam", "Grant", "Harney", "Hood River",
  "Jackson", "Jefferson", "Josephine", "Klamath", "Lake", "Lane", "Lincoln",
  "Linn", "Malheur", "Marion", "Morrow", "Multnomah", "Polk", "Sherman",
  "Tillamook", "Umatilla", "Union", "Wallowa", "Wasco", "Washington",
  "Wheeler", "Yamhill",
];

/** Cities common enough in Oregon solicitations to be worth mapping. */
const CITY_TO_COUNTY: Record<string, string> = {
  portland: "Multnomah",
  gresham: "Multnomah",
  "lake oswego": "Clackamas",
  "oregon city": "Clackamas",
  milwaukie: "Clackamas",
  beaverton: "Washington",
  hillsboro: "Washington",
  tigard: "Washington",
  tualatin: "Washington",
  salem: "Marion",
  keizer: "Marion",
  eugene: "Lane",
  springfield: "Lane",
  corvallis: "Benton",
  albany: "Linn",
  bend: "Deschutes",
  medford: "Jackson",
  "the dalles": "Wasco",
  astoria: "Clatsop",
  "coos bay": "Coos",
  roseburg: "Douglas",
  pendleton: "Umatilla",
  ontario: "Malheur",
  "klamath falls": "Klamath",
  newport: "Lincoln",
  mcminnville: "Yamhill",
  "forest grove": "Washington",
};

function clean(text: string): string {
  return text
    .replace(/ /g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .trim();
}

/** Labels are single-line by definition: collapse everything, drop the colon. */
function cleanLabel(text: string): string {
  return clean(text).replace(/\s+/g, " ").replace(/\s*:\s*$/, "").trim();
}

export function parseBidDetail(html: string, docId: string): ParsedBid {
  // Address and contact blocks are <br>-separated. Cheerio's .text() drops the
  // tag with no separator, welding "…@saif.com" onto "Phone:" and "Salem, OR
  // 97312" onto "US". Turn them into real newlines before parsing.
  const $ = cheerio.load(html.replace(/<br\s*\/?>/gi, "\n"));

  // ── label → value map ────────────────────────────────────────────────────
  const fields: Record<string, string> = {};
  $("td.t-head-01").each((_, el) => {
    const label = cleanLabel($(el).text());
    if (!label) return;
    const value = clean($(el).next("td").text());
    // First one wins: the header table comes before the quote history table,
    // which repeats some labels.
    if (label && value && !(label in fields)) fields[label] = value;
  });

  // ── attachments ──────────────────────────────────────────────────────────
  const attachments: ParsedAttachment[] = [];
  const seenFiles = new Set<string>();
  $("a[href^='javascript:downloadFile']").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    const match = href.match(/downloadFile\('(\d+)'/);
    const fileName = clean($(el).text());
    if (!match || !fileName || seenFiles.has(match[1])) return;
    seenFiles.add(match[1]);
    attachments.push({ fileNbr: match[1], fileName });
  });

  // ── NIGP codes ───────────────────────────────────────────────────────────
  // Rendered as <u>988-15</u> under each "NIGP Code:" label.
  const nigpCodes = Array.from(
    new Set(
      $("u")
        .map((_, el) => clean($(el).text()))
        .get()
        .filter((text) => /^\d{2,3}-\d{2,3}$/.test(text)),
    ),
  );

  // ── item descriptions, which often carry the real scope wording ──────────
  const itemLines: string[] = [];
  $("td.inputs-01").each((_, el) => {
    const text = clean($(el).text());
    if (text && text.length < 500) itemLines.push(text);
  });

  const descriptionParts = [
    fields["Bulletin Desc"],
    fields["Pre Bid Conference"] &&
      !/there is no pre-bid conference/i.test(fields["Pre Bid Conference"])
      ? `Pre-bid conference: ${fields["Pre Bid Conference"]}`
      : null,
    itemLines.length ? `Line items: ${Array.from(new Set(itemLines)).join("; ")}` : null,
  ].filter(Boolean) as string[];

  const shipTo = fields["Ship-to Address"] ?? null;
  const locationText = [fields["Location"], shipTo].filter(Boolean).join("\n") || null;
  const agency = fields["Organization"] ?? null;

  return {
    sourceBidNumber: fields["Bid Number"] || docId,
    title: fields["Description"] ?? null,
    agency,
    buyerName: fields["Purchaser"] ?? null,
    buyerEmail: firstEmail(fields["Info Contact"] ?? shipTo ?? ""),
    postedAt: parseOregonDate(fields["Available Date"] ?? fields["Required Date"]),
    closeAt: parseOregonDate(fields["Bid Opening Date"]),
    bidUrl: bidDetailUrl(docId),
    descriptionRaw: descriptionParts.join("\n\n") || null,
    nigpCodes,
    locationText,
    county: inferCounty(`${agency ?? ""}\n${locationText ?? ""}`),
    attachments,
    rawHtmlHash: crypto.createHash("sha256").update(html).digest("hex"),
    fields,
  };
}

function firstEmail(text: string): string | null {
  const match = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  return match ? match[0] : null;
}

/**
 * Best-effort county. "Marion County" in the agency name is the easy case;
 * otherwise fall back to the city in the ship-to address. Null is a fine
 * answer — the analysis prompt sees the raw location text either way.
 */
export function inferCounty(text: string): string | null {
  if (!text.trim()) return null;

  for (const county of OREGON_COUNTIES) {
    if (new RegExp(`\\b${county}\\s+County\\b`, "i").test(text)) return county;
  }
  const lower = text.toLowerCase();
  for (const [city, county] of Object.entries(CITY_TO_COUNTY)) {
    if (new RegExp(`\\b${city}\\b`, "i").test(lower)) return county;
  }
  return null;
}
