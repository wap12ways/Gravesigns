import { NextResponse } from "next/server";
import { extractDocId } from "@/lib/oregonbuys/fetcher";
import { ingestBid, type IngestResult } from "@/lib/oregonbuys/ingest";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Manual bid import.
 *
 * POST { "input": "<bid url, bid number, or several separated by newlines/commas>" }
 *
 * The guaranteed way in. Whatever the list scraper misses, paste it here.
 * Manual imports bypass the keyword filter: an operator pasting a URL has
 * already made the judgement call.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { input?: string };
  const raw = (body.input ?? "").trim();
  if (!raw) {
    return NextResponse.json({ error: "Paste a bid URL or bid number." }, { status: 400 });
  }

  const tokens = raw
    .split(/[\n,]+/)
    .map((t) => t.trim())
    .filter(Boolean);

  const docIds: string[] = [];
  const unrecognised: string[] = [];
  for (const token of tokens) {
    const docId = extractDocId(token);
    if (docId) {
      if (!docIds.includes(docId)) docIds.push(docId);
    } else {
      unrecognised.push(token);
    }
  }

  if (!docIds.length) {
    return NextResponse.json(
      {
        error:
          "No bid id found. Paste the full bidDetail.sda URL, or a bid number like S-435000-00017903.",
        unrecognised,
      },
      { status: 400 },
    );
  }

  const results: IngestResult[] = [];
  const failures: { docId: string; error: string }[] = [];

  for (const docId of docIds) {
    try {
      results.push(await ingestBid(docId, { applyFilter: false, importSource: "manual" }));
    } catch (error) {
      failures.push({
        docId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return NextResponse.json({
    imported: results.length,
    results,
    failures,
    unrecognised,
  });
}
