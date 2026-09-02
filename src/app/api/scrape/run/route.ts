import { NextResponse } from "next/server";
import { runScrape } from "@/lib/oregonbuys/scrape";

export const runtime = "nodejs";
export const maxDuration = 300;

/** "Run scraper now" from /admin. Behind the password gate. */
export async function POST() {
  try {
    return NextResponse.json(await runScrape({ trigger: "manual" }));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
