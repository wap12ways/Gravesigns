import { db, isDbConfigured } from "@/lib/supabase";
import { formatPacific } from "@/lib/time";
import type { ScrapeRun } from "@/lib/types";
import { AnalyzeAllButton } from "./analyze-all-button";
import { ConnectionCheck } from "./connection-check";
import { ImportForm } from "./import-form";
import { RunScraperButton } from "./run-scraper-button";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!isDbConfigured()) {
    return (
      <div className="p-6">
        <h1 className="text-base font-semibold">Admin</h1>
        <p className="mt-2 max-w-lg text-sm text-red-600">
          Supabase is not configured. Set <code>SUPABASE_URL</code> and{" "}
          <code>SUPABASE_SERVICE_ROLE_KEY</code>, then reload.
        </p>
      </div>
    );
  }

  const { data: runs } = await db()
    .from("scrape_runs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(20);

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-base font-semibold">Admin</h1>

      <ConnectionCheck />

      <div className="grid gap-6 lg:grid-cols-2">
        <ImportForm />
        <RunScraperButton />
        <AnalyzeAllButton />
      </div>

      <div className="card">
        <div className="card-title">Scrape runs</div>
        <div className="overflow-x-auto">
          <table className="op-table">
            <thead>
              <tr>
                <th>Started</th>
                <th>Trigger</th>
                <th className="text-right">Seen</th>
                <th className="text-right">Matched</th>
                <th className="text-right">New</th>
                <th className="text-right">Closed</th>
                <th className="text-right">Docs</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {(runs as ScrapeRun[] | null)?.map((run) => (
                <tr key={run.id}>
                  <td className="whitespace-nowrap">{formatPacific(run.started_at)}</td>
                  <td>{run.trigger}</td>
                  <td className="text-right tabular-nums">{run.bids_seen}</td>
                  <td className="text-right tabular-nums">{run.bids_matched}</td>
                  <td className="text-right tabular-nums">{run.bids_new}</td>
                  <td className="text-right tabular-nums">{run.bids_closed}</td>
                  <td className="text-right tabular-nums">{run.docs_fetched}</td>
                  <td>
                    {run.finished_at === null ? (
                      <span className="text-amber-700">running…</span>
                    ) : run.ok ? (
                      <span className="text-alpha-dark">ok</span>
                    ) : (
                      <span className="text-red-600">
                        {run.errors?.[0]?.message ?? "failed"}
                        {run.errors?.length > 1 && ` (+${run.errors.length - 1} more)`}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {!runs?.length && (
                <tr>
                  <td colSpan={8} className="text-slate-500">
                    No scrape runs yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
