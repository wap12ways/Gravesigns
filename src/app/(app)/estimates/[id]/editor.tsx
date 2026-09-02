"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { computeTotals, usd } from "@/lib/money";
import type { Estimate, LineItem, UnitPrice } from "@/lib/types";

/**
 * The estimate editor. Totals recompute locally as you type so the number
 * moves while you are thinking; the server recomputes them again on save, and
 * the server's answer is the one that is stored.
 */
export function EstimateEditor({
  estimate,
  prices,
  bidNumber,
  bidTitle,
  solicitationId,
}: {
  estimate: Estimate;
  prices: UnitPrice[];
  bidNumber: string;
  bidTitle: string | null;
  solicitationId: string;
}) {
  const [lineItems, setLineItems] = useState<LineItem[]>(estimate.line_items ?? []);
  const [markupPct, setMarkupPct] = useState(Number(estimate.markup_pct));
  const [contingencyPct, setContingencyPct] = useState(Number(estimate.contingency_pct));
  const [assumptions, setAssumptions] = useState(estimate.assumptions ?? "");
  const [exclusions, setExclusions] = useState(estimate.exclusions ?? "");
  const [narrative, setNarrative] = useState(estimate.narrative ?? "");
  const [status, setStatus] = useState(estimate.status);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);

  const totals = useMemo(
    () => computeTotals(lineItems, markupPct, contingencyPct),
    [lineItems, markupPct, contingencyPct],
  );

  function updateLine(index: number, patch: Partial<LineItem>) {
    setLineItems((current) =>
      current.map((li, i) => (i === index ? { ...li, ...patch } : li)),
    );
  }

  function pickPrice(index: number, itemCode: string) {
    const price = prices.find((p) => p.item_code === itemCode);
    if (!price) return;
    updateLine(index, {
      item_code: price.item_code,
      description: price.description,
      unit: price.unit,
      unit_price: Number(price.unit_price),
    });
  }

  function addRow() {
    setLineItems((current) => [
      ...current,
      {
        item_code: null,
        description: "",
        qty: 0,
        unit: "ls",
        unit_price: 0,
        extended: 0,
        assumptions: null,
        qty_from_docs: false,
      },
    ]);
  }

  async function save(nextStatus?: Estimate["status"]) {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch(`/api/estimates/${estimate.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          line_items: lineItems,
          markup_pct: markupPct,
          contingency_pct: contingencyPct,
          assumptions,
          exclusions,
          narrative,
          ...(nextStatus ? { status: nextStatus } : {}),
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? `HTTP ${response.status}`);
      if (nextStatus) setStatus(nextStatus);
      setMessage(`Saved. Total ${usd(body.totals.total)}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function regenerateNarrative() {
    setRegenerating(true);
    setError(null);
    try {
      const response = await fetch(`/api/estimates/${estimate.id}/narrative`, { method: "POST" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? `HTTP ${response.status}`);
      setNarrative(body.narrative);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRegenerating(false);
    }
  }

  const assumedCount = lineItems.filter((li) => !li.qty_from_docs).length;

  return (
    <div className="space-y-4 p-6">
      <header className="card">
        <div className="flex flex-wrap items-start justify-between gap-4 p-4">
          <div className="min-w-0">
            <div className="font-mono text-2xs text-slate-500">
              {bidNumber} · version {estimate.version} ·{" "}
              <span
                className={
                  status === "submitted"
                    ? "text-alpha-dark"
                    : status === "reviewed"
                      ? "text-amber-700"
                      : "text-slate-500"
                }
              >
                {status}
              </span>
            </div>
            <h1 className="mt-0.5 text-base font-semibold">{bidTitle ?? "(no title)"}</h1>
            <Link
              href={`/solicitations/${solicitationId}`}
              className="mt-1 inline-block text-2xs text-alpha hover:underline"
            >
              ← Back to the solicitation
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a href={`/api/estimates/${estimate.id}/csv`} className="btn-ghost">
              Export CSV
            </a>
            <Link href={`/estimates/${estimate.id}/print`} className="btn-ghost">
              Estimate package (PDF)
            </Link>
            <button onClick={() => save()} disabled={saving} className="btn">
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>

        {(message || error) && (
          <div className="border-t border-slate-200 px-4 py-2 text-2xs">
            {message && <span className="text-alpha-dark">{message}</span>}
            {error && <span className="text-red-600">{error}</span>}
          </div>
        )}
      </header>

      <section className="card">
        <div className="card-title flex items-center justify-between">
          <span>Line items ({lineItems.length})</span>
          {assumedCount > 0 && (
            <span className="font-normal normal-case tracking-normal text-amber-700">
              {assumedCount} quantity{assumedCount === 1 ? "" : "s"} assumed, not from the documents
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="op-table">
            <thead>
              <tr>
                <th className="w-40">Item</th>
                <th>Description</th>
                <th className="w-24 text-right">Qty</th>
                <th className="w-14">Unit</th>
                <th className="w-28 text-right">Unit price</th>
                <th className="w-28 text-right">Extended</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((li, index) => (
                <tr key={index} className={li.qty_from_docs ? "" : "bg-amber-50/40"}>
                  <td>
                    <select
                      value={li.item_code ?? ""}
                      onChange={(e) => pickPrice(index, e.target.value)}
                      className="field font-mono text-2xs"
                    >
                      <option value="">— custom —</option>
                      {prices.map((p) => (
                        <option key={p.item_code} value={p.item_code}>
                          {p.item_code}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      value={li.description}
                      onChange={(e) => updateLine(index, { description: e.target.value })}
                      className="field"
                    />
                    <input
                      value={li.assumptions ?? ""}
                      onChange={(e) => updateLine(index, { assumptions: e.target.value })}
                      placeholder="Assumption for this line"
                      className="field mt-1 text-2xs"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="any"
                      value={li.qty}
                      onChange={(e) =>
                        updateLine(index, {
                          qty: Number(e.target.value),
                          // Typing a quantity by hand is a human decision, not
                          // something read off the documents.
                          qty_from_docs: false,
                        })
                      }
                      className="field text-right tabular-nums"
                    />
                  </td>
                  <td>
                    <input
                      value={li.unit}
                      onChange={(e) => updateLine(index, { unit: e.target.value })}
                      className="field text-center"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      value={li.unit_price}
                      onChange={(e) => updateLine(index, { unit_price: Number(e.target.value) })}
                      className="field text-right tabular-nums"
                    />
                  </td>
                  <td className="text-right tabular-nums">
                    {usd(li.qty * li.unit_price)}
                  </td>
                  <td>
                    <button
                      onClick={() => setLineItems((c) => c.filter((_, i) => i !== index))}
                      title="Delete row"
                      className="text-slate-400 hover:text-red-600"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
              {!lineItems.length && (
                <tr>
                  <td colSpan={7} className="text-slate-500">
                    No line items. Add a row to start.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-200 p-3">
          <button onClick={addRow} className="btn-ghost">
            + Add row
          </button>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="card lg:col-span-1">
          <div className="card-title">Totals</div>
          <div className="space-y-2 p-4 text-sm">
            <Row label="Subtotal" value={usd(totals.subtotal)} />
            <div className="flex items-center justify-between gap-2">
              <label className="flex items-center gap-1.5 text-slate-600">
                Markup
                <input
                  type="number"
                  step="0.5"
                  value={markupPct}
                  onChange={(e) => setMarkupPct(Number(e.target.value))}
                  className="field w-16 py-0.5 text-right tabular-nums"
                />
                %
              </label>
              <span className="tabular-nums">{usd(totals.markup)}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <label className="flex items-center gap-1.5 text-slate-600">
                Contingency
                <input
                  type="number"
                  step="0.5"
                  value={contingencyPct}
                  onChange={(e) => setContingencyPct(Number(e.target.value))}
                  className="field w-16 py-0.5 text-right tabular-nums"
                />
                %
              </label>
              <span className="tabular-nums">{usd(totals.contingency)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-300 pt-2 text-base font-semibold">
              <span>Total</span>
              <span className="tabular-nums">{usd(totals.total)}</span>
            </div>

            <div className="space-y-2 border-t border-slate-200 pt-3">
              <button
                onClick={() => save("reviewed")}
                disabled={saving || status === "submitted"}
                className="btn-ghost w-full"
              >
                Mark reviewed
              </button>
              <button
                onClick={() => save("submitted")}
                disabled={saving || status === "submitted"}
                className="btn w-full"
              >
                {status === "submitted" ? "Submitted" : "Mark submitted"}
              </button>
              {estimate.submitted_at && (
                <p className="text-center text-2xs text-slate-500">
                  Submitted {new Date(estimate.submitted_at).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="card lg:col-span-2">
          <div className="card-title">Assumptions and exclusions</div>
          <div className="grid gap-4 p-4 sm:grid-cols-2">
            <div>
              <label className="text-2xs font-semibold uppercase tracking-wide text-slate-500">
                Assumptions
              </label>
              <textarea
                value={assumptions}
                onChange={(e) => setAssumptions(e.target.value)}
                rows={10}
                className="field mt-1 text-sm"
              />
            </div>
            <div>
              <label className="text-2xs font-semibold uppercase tracking-wide text-slate-500">
                Exclusions
              </label>
              <textarea
                value={exclusions}
                onChange={(e) => setExclusions(e.target.value)}
                rows={10}
                className="field mt-1 text-sm"
              />
            </div>
          </div>
        </section>
      </div>

      <section className="card">
        <div className="card-title flex items-center justify-between">
          <span>Cover letter</span>
          <button
            onClick={regenerateNarrative}
            disabled={regenerating}
            className="font-normal normal-case tracking-normal text-alpha hover:underline disabled:opacity-50"
          >
            {regenerating ? "Regenerating…" : "Regenerate"}
          </button>
        </div>
        <div className="p-4">
          <textarea
            value={narrative}
            onChange={(e) => setNarrative(e.target.value)}
            rows={12}
            placeholder="No cover letter yet. Press Regenerate."
            className="field text-sm leading-relaxed"
          />
        </div>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-600">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
