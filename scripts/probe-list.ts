/**
 * Fetch and parse the OregonBuys open-bids list, print what matched the
 * keyword filter, store nothing.
 *
 *   npx tsx scripts/probe-list.ts
 *   npx tsx scripts/probe-list.ts --file ./saved-list.html
 */
import fs from "node:fs";
import { matchesKeywords } from "../src/config/filters";
import { parseOpenBidsList } from "../src/lib/oregonbuys/list";
import { fetchHtml, OPEN_BIDS_URL } from "../src/lib/oregonbuys/fetcher";

async function main() {
  const args = process.argv.slice(2);
  const fileIdx = args.indexOf("--file");

  const html =
    fileIdx !== -1
      ? fs.readFileSync(args[fileIdx + 1], "utf8")
      : await fetchHtml((console.log(`GET ${OPEN_BIDS_URL}`), OPEN_BIDS_URL));

  const { rows, totalReported } = parseOpenBidsList(html);
  console.log(`\n${rows.length} rows on page 1 of ${totalReported ?? "?"} open bids\n`);

  for (const row of rows) {
    const hits = matchesKeywords(row.title);
    const mark = hits.length ? "MATCH" : "     ";
    console.log(
      `${mark} ${row.docId.padEnd(20)} ${(row.agency ?? "").slice(0, 28).padEnd(29)} ${(row.title ?? "").slice(0, 60)}`,
    );
    if (hits.length) console.log(`        title keywords: ${hits.join(", ")}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
