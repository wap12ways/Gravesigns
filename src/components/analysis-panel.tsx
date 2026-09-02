import { Flag, RecommendationBadge, ScoreBadge } from "./badges";
import type { BidRequirements, ScopeItem, SolicitationAnalysis } from "@/lib/types";

/**
 * The analysis read-out on a solicitation page: score, why, what the bid
 * requires of us, what the scope is.
 */
export function AnalysisPanel({ analysis }: { analysis: SolicitationAnalysis }) {
  const requirements = analysis.requirements as Partial<BidRequirements>;
  const scopeItems = (analysis.scope_items ?? []) as ScopeItem[];

  return (
    <div className="space-y-4">
      <section className="card">
        <div className="card-title flex items-center justify-between">
          <span>Analysis</span>
          <span className="font-normal normal-case tracking-normal text-slate-400">
            {analysis.model} · {new Date(analysis.created_at).toLocaleString()}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-4">
          <ScoreBadge score={analysis.fit_score} />
          <RecommendationBadge value={analysis.bid_recommendation} />
          <span className="text-2xs uppercase tracking-wide text-slate-500">
            {analysis.estimated_size_band ?? "size unknown"}
          </span>
        </div>

        {analysis.scope_summary && (
          <div className="border-b border-slate-200 p-4">
            <p className="text-sm text-slate-700">{analysis.scope_summary}</p>
          </div>
        )}

        {analysis.reasons?.length > 0 && (
          <div className="border-b border-slate-200 p-4">
            <div className="text-2xs font-semibold uppercase tracking-wide text-slate-500">
              Reasoning
            </div>
            <ul className="mt-1.5 space-y-1 text-sm text-slate-700">
              {analysis.reasons.map((reason, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-slate-300">—</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {analysis.red_flags?.length > 0 && (
          <div className="border-b border-slate-200 bg-red-50/60 p-4">
            <div className="text-2xs font-semibold uppercase tracking-wide text-red-700">
              Red flags
            </div>
            <ul className="mt-1.5 space-y-1 text-sm text-red-900">
              {analysis.red_flags.map((flag, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-red-300">!</span>
                  <span>{flag}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="p-4">
          <div className="text-2xs font-semibold uppercase tracking-wide text-slate-500">
            Requirements
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Flag on={Boolean(requirements.site_walk)} label="Site walk" />
            <Flag on={Boolean(requirements.mandatory_pre_bid)} label="Mandatory pre-bid" />
            <Flag on={Boolean(requirements.prevailing_wage)} label="Prevailing wage" />
            <Flag on={Boolean(requirements.bond_required)} label="Bond" />
          </div>
          <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <Detail label="Site walk date" value={requirements.site_walk_date} />
            <Detail label="Questions due" value={requirements.questions_deadline} />
            <Detail label="Bond details" value={requirements.bond_details} />
            <Detail label="Insurance" value={requirements.insurance} />
            <Detail
              label="Certifications"
              value={requirements.certifications?.length ? requirements.certifications.join(", ") : null}
            />
          </dl>
        </div>
      </section>

      <section className="card">
        <div className="card-title">Scope items ({scopeItems.length})</div>
        <div className="overflow-x-auto">
          <table className="op-table">
            <thead>
              <tr>
                <th className="w-[38%]">Description</th>
                <th className="text-right">Qty</th>
                <th>Unit</th>
                <th>Material</th>
                <th>Location</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {scopeItems.map((item, i) => (
                <tr key={i}>
                  <td>{item.description}</td>
                  <td className="text-right tabular-nums">
                    {item.quantity ?? <span className="text-amber-700">not stated</span>}
                  </td>
                  <td>{item.unit ?? "—"}</td>
                  <td className="text-2xs text-slate-600">{item.material_type ?? "—"}</td>
                  <td className="text-2xs text-slate-600">{item.location ?? "—"}</td>
                  <td className="text-2xs text-slate-500">{item.notes ?? "—"}</td>
                </tr>
              ))}
              {!scopeItems.length && (
                <tr>
                  <td colSpan={6} className="text-slate-500">
                    No scope items extracted — the documents did not contain a priced scope.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="min-w-0">
      <dt className="text-2xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-slate-800">{value || "—"}</dd>
    </div>
  );
}
