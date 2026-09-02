/**
 * Run one scrape from the command line.
 *
 *   npx tsx scripts/run-scrape.ts
 *
 * Needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment.
 *
 * This is also the proof that src/lib/oregonbuys/scrape.ts is portable: it is
 * a plain Node module with no Next.js imports, so an AWS Lambda handler is
 * three lines —
 *
 *   const { runScrape } = require("./scrape");
 *   exports.handler = async () => runScrape({ trigger: "cron" });
 */
import { runScrape } from "../src/lib/oregonbuys/scrape";

runScrape({ trigger: "manual" })
  .then((summary) => {
    console.log(JSON.stringify(summary, null, 2));
    process.exit(summary.ok ? 0 : 1);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
