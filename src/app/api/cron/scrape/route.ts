import { NextResponse } from "next/server";
import { runScrape } from "@/lib/oregonbuys/scrape";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * The scheduled scrape. Registered in vercel.json to run once a day.
 *
 * This route is outside the password gate (middleware exempts /api/cron), so
 * it authenticates on CRON_SECRET instead. Vercel sends it as a bearer token.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured." }, { status: 500 });
  }

  const header = request.headers.get("authorization");
  if (header !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return NextResponse.json(await runScrape({ trigger: "cron" }));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
