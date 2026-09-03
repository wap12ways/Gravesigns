"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { usd } from "@/lib/money";
import { daysUntil, formatPacific } from "@/lib/time";
import type { EstimateListRow } from "@/lib/estimates-list";
import type { EstimateStatus } from "@/lib/types";

const FILTERS = ["all", "draft", "reviewed", "submitted"] as const;
type Filter = (typeof FILTERS)[number];

const STATUS_TONE: Record<EstimateStatus, string> = {
  draft: "border-slate-300 bg-slate-100 text-slate-600",
  reviewed: "border-amber-300 bg-amber-50 text-amber-800",
  submitted: "border-alpha bg-alpha-light text-alpha-dark",
};

export function EstimatesTable({ rows }: { rows: EstimateListRow[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (filter !== "all" && row.status !== filter) return false;
      if (!needle) return true;
      return `${row.bid_title ?? ""} ${row.bid_number ?? ""} ${row.agency ?? ""}`
        .toLowerCase()
        .includes(needle);
    });
  }, [rows, filter, search]);

  const pipelineValue = visible
    .filter((r) => r.status !== "submitted")
    .reduce((sum, r) => sum + r.total, 0);
  const submittedValue = visible
    .filter((r) => r.status === "submitted")
    .reduce((sum, r) => sum + r.total, 0);

  async function remove(row: EstimateListRow) {
    const label = `${row.bid_number ?? "this bid"} v${row.version}`;
    if (!window.confirm(`Delete estimate ${label}? This cannot be undone.`)) return;

    setDeleting(row.id);
    setError(null);
    try {
      const response = await fetch(`/api/estimates/${row.id}`, { method: "DELETE" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? `HTTP ${response.status}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex overflow-hidden rounded border border-slate-300">
          {FILTERS.map((option) => (
            <button
              key={option}
              onClick={() => setFilter(option)}
              className={`px-2.5 py-1 text-2xs capitalize transition ${
                filter === option
                  ? "bg-ink-900 font-medium text-white"
                  : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by bid, agency, number…"
          className="field w-64"
        />
        <div className="ml-auto flex items-center gap-4 text-2xs tabular-nums text-slate-600">
          <span>
            In progress <strong className="text-slate-900">{usd(pipelineValue)}</strong>
          </span>
          <span>
            Submitted <strong className="text-alpha-dark">{usd(submittedValue)}</strong>
          </span>
          <span className="text-slate-400">
            {visible.length} of {rows.length}
          </span>
        </div>
      </div>

      {error && <p className="text-2xs text-red-600">{error}</p>}

      <div className="card overflow-x-auto">
        <table className="op-table">
          <thead>
            <tr>
              <th className="w-16">Ver.</th>
              <th className="w-24">Status</th>
              <th>Bid</th>
              <th className="w-48">Agency</th>
              <th className="w-28">Closes</th>
              <th className="w-16 text-right">Lines</th>
              <th className="w-28 text-right">Total</th>
              <th className="w-28">Created</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => {
              const days = daysUntil(row.close_at);
              return (
                <tr key={row.id}>
                  <td>
                    <Link
                      href={`/estimates/${row.id}`}
                      className="font-medium text-alpha hover:underline"
                    >
                      v{row.version}
                    </Link>
                  </td>
                  <td>
                    <span
                      className={`inline-block rounded border px-1.5 py-0.5 text-2xs font-medium capitalize ${STATUS_TONE[row.status]}`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td>
                    <Link
                      href={`/estimates/${row.id}`}
                      className="font-medium text-slate-900 hover:text-alpha hover:underline"
                    >
                      {row.bid_title ?? "(no title)"}
                    </Link>
                    <div className="font-mono text-2xs text-slate-400">
                      {row.bid_number ?? "—"}
                    </div>
                  </td>
                  <td className="text-2xs text-slate-600">{row.agency ?? "—"}</td>
                  <td className="whitespace-nowrap text-2xs">
                    {formatPacific(row.close_at, false)}
                    {days !== null && (
                      <div
                        className={
                          days < 0
                            ? "text-slate-400"
                            : days <= 5
                              ? "font-semibold text-red-600"
                              : "text-slate-500"
                        }
                      >
                        {days < 0 ? "closed" : `${days}d`}
                      </div>
                    )}
                  </td>
                  <td className="text-right tabular-nums">{row.line_item_count}</td>
                  <td className="text-right font-medium tabular-nums">{usd(row.total)}</td>
                  <td className="text-2xs text-slate-500">
                    {formatPacific(row.created_at, false)}
                    {row.submitted_at && (
                      <div className="text-alpha-dark">
                        sent {formatPacific(row.submitted_at, false)}
                      </div>
                    )}
                  </td>
                  <td>
                    <button
                      onClick={() => remove(row)}
                      disabled={deleting === row.id}
                      title={
                        row.status === "submitted"
                          ? "Submitted estimates must be set back to draft first"
                          : "Delete this estimate"
                      }
                      className="text-slate-400 hover:text-red-600 disabled:opacity-40"
                    >
                      {deleting === row.id ? "…" : "✕"}
                    </button>
                  </td>
                </tr>
              );
            })}
            {!visible.length && (
              <tr>
                <td colSpan={9} className="text-slate-500">
                  {rows.length
                    ? "Nothing matches this filter."
                    : "No estimates yet. Open a scored bid from the Pipeline and press Generate estimate."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
