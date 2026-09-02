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

/**
 * Oregon city → county, keyed lowercase.
 *
 * Only consulted against a city parsed out of a "City, OR 97005" address line,
 * never scanned loosely over the page — otherwise "Adams" in a buyer's name
 * would put a Beaverton job in Umatilla County.
 */
const CITY_TO_COUNTY: Record<string, string> = {
  // Multnomah
  portland: "Multnomah", gresham: "Multnomah", troutdale: "Multnomah",
  fairview: "Multnomah", "wood village": "Multnomah",
  // Washington
  beaverton: "Washington", hillsboro: "Washington", tigard: "Washington",
  tualatin: "Washington", "forest grove": "Washington", sherwood: "Washington",
  cornelius: "Washington", "north plains": "Washington", banks: "Washington",
  gaston: "Washington", durham: "Washington", "king city": "Washington",
  // Clackamas
  "oregon city": "Clackamas", "lake oswego": "Clackamas", milwaukie: "Clackamas",
  "west linn": "Clackamas", gladstone: "Clackamas", canby: "Clackamas",
  molalla: "Clackamas", estacada: "Clackamas", sandy: "Clackamas",
  "happy valley": "Clackamas", wilsonville: "Clackamas",
  // Marion
  salem: "Marion", keizer: "Marion", woodburn: "Marion", silverton: "Marion",
  stayton: "Marion", "mount angel": "Marion", aumsville: "Marion",
  gervais: "Marion", hubbard: "Marion", turner: "Marion", sublimity: "Marion",
  // Polk
  dallas: "Polk", independence: "Polk", monmouth: "Polk",
  // Yamhill
  mcminnville: "Yamhill", newberg: "Yamhill", dundee: "Yamhill",
  carlton: "Yamhill", lafayette: "Yamhill", sheridan: "Yamhill", amity: "Yamhill",
  // Linn / Benton
  albany: "Linn", lebanon: "Linn", "sweet home": "Linn", harrisburg: "Linn",
  brownsville: "Linn", corvallis: "Benton", philomath: "Benton",
  // Lane
  eugene: "Lane", springfield: "Lane", "cottage grove": "Lane",
  florence: "Lane", "junction city": "Lane", veneta: "Lane",
  creswell: "Lane", oakridge: "Lane",
  // Deschutes / Crook / Jefferson
  bend: "Deschutes", redmond: "Deschutes", sisters: "Deschutes",
  "la pine": "Deschutes", prineville: "Crook", madras: "Jefferson",
  culver: "Jefferson", metolius: "Jefferson",
  // Jackson / Josephine
  medford: "Jackson", ashland: "Jackson", "central point": "Jackson",
  talent: "Jackson", phoenix: "Jackson", "eagle point": "Jackson",
  jacksonville: "Jackson", "white city": "Jackson", "rogue river": "Jackson",
  "gold hill": "Jackson", "shady cove": "Jackson",
  "grants pass": "Josephine", "cave junction": "Josephine",
  // Douglas / Coos / Curry
  roseburg: "Douglas", sutherlin: "Douglas", winston: "Douglas",
  "myrtle creek": "Douglas", reedsport: "Douglas", canyonville: "Douglas",
  "coos bay": "Coos", "north bend": "Coos", coquille: "Coos",
  bandon: "Coos", "myrtle point": "Coos",
  brookings: "Curry", "gold beach": "Curry", "port orford": "Curry",
  // Coast: Clatsop / Tillamook / Lincoln / Columbia
  astoria: "Clatsop", seaside: "Clatsop", warrenton: "Clatsop",
  "cannon beach": "Clatsop", gearhart: "Clatsop",
  tillamook: "Tillamook", "rockaway beach": "Tillamook", garibaldi: "Tillamook",
  manzanita: "Tillamook", nehalem: "Tillamook",
  newport: "Lincoln", "lincoln city": "Lincoln", toledo: "Lincoln",
  waldport: "Lincoln", "depoe bay": "Lincoln", yachats: "Lincoln", siletz: "Lincoln",
  "st helens": "Columbia", "saint helens": "Columbia", scappoose: "Columbia",
  rainier: "Columbia", clatskanie: "Columbia", vernonia: "Columbia",
  // Columbia Gorge
  "hood river": "Hood River", "cascade locks": "Hood River",
  "the dalles": "Wasco", dufur: "Wasco", mosier: "Wasco", maupin: "Wasco",
  condon: "Gilliam", arlington: "Gilliam", moro: "Sherman", rufus: "Sherman",
  "grass valley": "Sherman",
  // Eastern Oregon
  pendleton: "Umatilla", hermiston: "Umatilla", "milton-freewater": "Umatilla",
  umatilla: "Umatilla", stanfield: "Umatilla", "pilot rock": "Umatilla",
  heppner: "Morrow", boardman: "Morrow", irrigon: "Morrow",
  "la grande": "Union", "island city": "Union", elgin: "Union",
  enterprise: "Wallowa", joseph: "Wallowa",
  "baker city": "Baker", ontario: "Malheur", vale: "Malheur", nyssa: "Malheur",
  burns: "Harney", hines: "Harney", lakeview: "Lake",
  "klamath falls": "Klamath", chiloquin: "Klamath",
  "john day": "Grant", "canyon city": "Grant", "prairie city": "Grant",
  "mount vernon": "Grant", fossil: "Wheeler",
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
 * Best-effort county.
 *
 * Two signals, in order of trust:
 *  1. "Marion County" written out in the agency name or location.
 *  2. The city on a "Talent, OR 97540" address line.
 *
 * Deliberately NOT a loose scan for city names anywhere in the text — that
 * puts a Beaverton job in Umatilla County the moment a buyer is called Adams.
 * Null is a fine answer; the analysis prompt reads the raw location either way.
 */
export function inferCounty(text: string): string | null {
  if (!text.trim()) return null;

  for (const county of OREGON_COUNTIES) {
    if (new RegExp(`\\b${county}\\s+County\\b`, "i").test(text)) return county;
  }

  // "City, OR 97540" / "City, Oregon 97540" — take the last one, which is the
  // ship-to city rather than a street name earlier in the block.
  const matches = [...text.matchAll(/([A-Za-z][A-Za-z .'-]{1,30}?),\s*(?:OR|Oregon)\.?\s+\d{5}/gi)];
  for (const match of matches.reverse()) {
    const city = match[1].trim().toLowerCase().replace(/\.$/, "");
    if (CITY_TO_COUNTY[city]) return CITY_TO_COUNTY[city];
  }
  return null;
}
