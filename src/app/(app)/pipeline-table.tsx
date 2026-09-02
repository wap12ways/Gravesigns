"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { RecommendationBadge, ScoreBadge } from "@/components/badges";
import { usd } from "@/lib/money";
import { daysUntil, formatPacific } from "@/lib/time";
import type { PipelineRow } from "@/lib/pipeline";

const RECOMMENDATION_FILTERS = ["all", "bid", "review", "no_bid", "unscored"] as const;
type RecommendationFilter = (typeof RECOMMENDATION_FILTERS)[number];

const DAY_FILTERS = [
  { key: "open", label: "Open" },
  { key: "7", label: "≤ 7 days" },
  { key: "14", label: "≤ 14 days" },
  { key: "all", label: "All incl. closed" },
] as const;
type DayFilter = (typeof DAY_FILTERS)[number]["key"];

export function PipelineTable({ rows }: { rows: PipelineRow[] }) {
  const router = useRouter();
  const [recommendation, setRecommendation] = useState<RecommendationFilter>("all");
  const [dayFilter, setDayFilter] = useState<DayFilter>("open");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (recommendation === "unscored") {
        if (row.bid_recommendation !== null) return false;
      } else if (recommendation !== "all" && row.bid_recommendation !== recommendation) {
        return false;
      }

      const days = daysUntil(row.close_at);
      if (dayFilter === "open" && (row.status !== "open" || (days !== null && days < 0))) return false;
      if (dayFilter === "7" && (days === null || days < 0 || days > 7)) return false;
      if (dayFilter === "14" && (days === null || days < 0 || days > 14)) return false;

      if (needle) {
        const haystack = [row.title, row.agency, row.source_bid_number, row.county]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [rows, recommendation, dayFilter, search]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <FilterGroup
          options={RECOMMENDATION_FILTERS.map((key) => ({
            key,
            label: key === "no_bid" ? "No bid" : key === "all" ? "All" : key[0].toUpperCase() + key.slice(1),
          }))}
          value={recommendation}
          onChange={(v) => setRecommendation(v as RecommendationFilter)}
        />
        <FilterGroup
          options={DAY_FILTERS.map((f) => ({ key: f.key, label: f.label }))}
          value={dayFilter}
          onChange={(v) => setDayFilter(v as DayFilter)}
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by title, agency, bid number…"
          className="field ml-auto w-64"
        />
        <span className="text-2xs tabular-nums text-slate-500">
          {filtered.length} of {rows.length}
        </span>
      </div>

      <div className="card overflow-x-auto">
        <table className="op-table">
          <thead>
            <tr>
              <th className="w-12">Score</th>
              <th className="w-20">Call</th>
              <th>Title</th>
              <th className="w-52">Agency</th>
              <th className="w-32">Closes</th>
              <th className="w-24">Size</th>
              <th className="w-14 text-center">Walk</th>
              <th className="w-12 text-center">Flags</th>
              <th className="w-32">Estimate</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => {
              const days = daysUntil(row.close_at);
              return (
                <tr
                  key={row.id}
                  onClick={() => router.push(`/solicitations/${row.id}`)}
                  className="cursor-pointer"
                >
                  <td>
                    <ScoreBadge score={row.fit_score} />
                  </td>
                  <td>
                    <RecommendationBadge value={row.bid_recommendation} />
                  </td>
                  <td>
                    <Link
                      href={`/solicitations/${row.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="font-medium text-slate-900 hover:text-alpha hover:underline"
                    >
                      {row.title ?? "(no title)"}
                    </Link>
                    <div className="font-mono text-2xs text-slate-400">{row.source_bid_number}</div>
                  </td>
                  <td className="text-2xs text-slate-600">
                    {row.agency ?? "—"}
                    {row.county && <div className="text-slate-400">{row.county} County</div>}
                  </td>
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
                        {days < 0 ? "closed" : `${days} day${days === 1 ? "" : "s"}`}
                      </div>
                    )}
                  </td>
                  <td className="text-2xs text-slate-600">{row.estimated_size_band ?? "—"}</td>
                  <td className="text-center">{row.site_walk ? "●" : <span className="text-slate-300">○</span>}</td>
                  <td className="text-center tabular-nums">
                    {row.red_flag_count > 0 ? (
                      <span className="text-red-600">{row.red_flag_count}</span>
                    ) : (
                      <span className="text-slate-300">0</span>
                    )}
                  </td>
                  <td className="text-2xs">
                    {row.estimate_id ? (
                      <Link
                        href={`/estimates/${row.estimate_id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-alpha hover:underline"
                      >
                        v{row.estimate_version} {row.estimate_status}
                        <div className="tabular-nums text-slate-500">{usd(row.estimate_total)}</div>
                      </Link>
                    ) : (
                      <span className="text-slate-400">none</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {!filtered.length && (
              <tr>
                <td colSpan={9} className="text-slate-500">
                  {rows.length
                    ? "Nothing matches these filters."
                    : "No solicitations yet. Import one on /admin, or run the scraper."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FilterGroup({
  options,
  value,
  onChange,
}: {
  options: { key: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="inline-flex overflow-hidden rounded border border-slate-300">
      {options.map((option) => (
        <button
          key={option.key}
          onClick={() => onChange(option.key)}
          className={`px-2.5 py-1 text-2xs transition ${
            value === option.key
              ? "bg-ink-900 font-medium text-white"
              : "bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
