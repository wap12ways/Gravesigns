"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface RunSummary {
  bids_seen?: number;
  bids_matched?: number;
  bids_new?: number;
  bids_closed?: number;
  docs_fetched?: number;
  errors?: { stage: string; message: string }[];
  error?: string;
}

export function RunScraperButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState<RunSummary | null>(null);

  async function run() {
    setBusy(true);
    setSummary(null);
    try {
      const res = await fetch("/api/scrape/run", { method: "POST" });
      setSummary(await res.json());
      router.refresh();
    } catch (error) {
      setSummary({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <div className="card-title">Run the scraper now</div>
      <div className="space-y-3 p-4 text-sm">
        <p className="text-slate-600">
          Reads page one of the OregonBuys open-bid list — the newest 25 postings — keeps
          anything matching the keyword or NIGP filter, and downloads its attachments.
          The same job runs on its own every 4 hours.
        </p>
        <button onClick={run} disabled={busy} className="btn">
          {busy ? "Running…" : "Run scraper"}
        </button>

        {summary && (
          <div className="rounded border border-slate-200 bg-slate-50 p-3 text-2xs">
            {summary.error ? (
              <p className="text-red-600">{summary.error}</p>
            ) : (
              <p className="tabular-nums text-slate-700">
                {summary.bids_seen} seen · {summary.bids_matched} matched ·{" "}
                {summary.bids_new} new · {summary.bids_closed} closed ·{" "}
                {summary.docs_fetched} documents
              </p>
            )}
            {summary.errors?.map((e, i) => (
              <p key={i} className="mt-1 text-red-600">
                {e.stage}: {e.message}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
