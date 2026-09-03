/**
 * Run one OregonBuys search and print what it finds. No database needed.
 *
 *   npx tsx scripts/probe-search.ts desc asbestos
 *   npx tsx scripts/probe-search.ts itemDesc demolition
 *   npx tsx scripts/probe-search.ts --sweep      # every configured term
 */
import { SEARCH_TERMS } from "../src/config/search-terms";
import { searchOpenBids, sweepSearches } from "../src/lib/oregonbuys/search";

async function main() {
  const args = process.argv.slice(2);

  if (args[0] === "--sweep") {
    console.log(`Sweeping ${SEARCH_TERMS.length} terms (~4s each)…\n`);
    const result = await sweepSearches(Date.now() + 10 * 60_000);
    for (const row of result.rows.values()) {
      console.log(`${row.docId.padEnd(22)} ${(row.closeAtText ?? "").padEnd(21)} ${(row.title ?? "").slice(0, 62)}`);
    }
    console.log(`\n${result.rows.size} distinct bids from ${result.searched} searches`);
    for (const e of result.errors) console.log(`  ! ${e.stage}: ${e.message}`);
    return;
  }

  const field = (args[0] ?? "desc") as "desc" | "itemDesc";
  const term = args.slice(1).join(" ") || "asbestos";
  const outcome = await searchOpenBids({ field, term });
  if (outcome.error) throw new Error(outcome.error);
  console.log(`${outcome.rows.length} result(s) for ${field}="${term}"\n`);
  for (const row of outcome.rows) {
    console.log(`  ${row.docId.padEnd(22)} ${(row.agency ?? "").slice(0, 28).padEnd(29)} ${(row.title ?? "").slice(0, 55)}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
