/**
 * Fetch and parse one OregonBuys bid, print what we got, store nothing.
 *
 *   npx tsx scripts/probe-bid.ts S-435000-00017903
 *   npx tsx scripts/probe-bid.ts "https://oregonbuys.gov/bso/external/bidDetail.sda?docId=..."
 *   npx tsx scripts/probe-bid.ts --file ./saved.html --doc-id S-1-2
 *
 * The fastest way to see whether a parser change still works against the live
 * site. No database or API keys needed.
 */
import fs from "node:fs";
import { parseBidDetail } from "../src/lib/oregonbuys/detail";
import { attachmentUrl, bidDetailUrl, extractDocId, fetchHtml } from "../src/lib/oregonbuys/fetcher";

async function main() {
  const args = process.argv.slice(2);
  const fileIdx = args.indexOf("--file");
  const docIdx = args.indexOf("--doc-id");

  let html: string;
  let docId: string;

  if (fileIdx !== -1) {
    html = fs.readFileSync(args[fileIdx + 1], "utf8");
    docId = docIdx !== -1 ? args[docIdx + 1] : "LOCAL-FILE";
  } else {
    const input = args[0];
    if (!input) throw new Error("Pass a bid URL, a bid number, or --file <path>.");
    const found = extractDocId(input);
    if (!found) throw new Error(`Could not find a docId in: ${input}`);
    docId = found;
    console.log(`GET ${bidDetailUrl(docId)}`);
    html = await fetchHtml(bidDetailUrl(docId));
  }

  const bid = parseBidDetail(html, docId);
  const { fields, attachments, ...summary } = bid;

  console.log("\n── parsed ──");
  console.dir(summary, { depth: null });

  console.log(`\n── attachments (${attachments.length}) ──`);
  for (const a of attachments) {
    console.log(`  [${a.fileNbr}] ${a.fileName}`);
    console.log(`      ${attachmentUrl(docId, a.fileNbr)}`);
  }

  console.log(`\n── raw label map (${Object.keys(fields).length}) ──`);
  for (const [k, v] of Object.entries(fields)) {
    console.log(`  ${k}: ${v.replace(/\n/g, " / ").slice(0, 100)}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
