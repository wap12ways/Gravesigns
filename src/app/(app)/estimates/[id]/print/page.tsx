import Image from "next/image";
import { notFound } from "next/navigation";
import { COMPANY } from "@/config/company";
import { usd, round2 } from "@/lib/money";
import { db } from "@/lib/supabase";
import { formatPacific } from "@/lib/time";
import type { Estimate, Solicitation } from "@/lib/types";
import { PrintButton } from "./print-button";

export const dynamic = "force-dynamic";

/**
 * The estimate package, laid out for paper.
 *
 * "Export PDF" is the browser's own print-to-PDF against this page. It is less
 * code than a server-side PDF library, and the output is the same document the
 * estimator sees on screen.
 */
export default async function PrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = db();

  const { data: estimate } = await supabase
    .from("estimates")
    .select("*")
    .eq("id", id)
    .maybeSingle<Estimate>();
  if (!estimate) notFound();

  const { data: bid } = await supabase
    .from("solicitations")
    .select("*")
    .eq("id", estimate.solicitation_id)
    .maybeSingle<Solicitation>();

  // Belt and braces: this page goes to a public agency buyer. An unfilled
  // placeholder must never print, however it got into the config.
  const printableLicenses = COMPANY.licenses.filter(
    (line) => !/^\s*TODO\b|TODO:/i.test(line),
  );

  const subtotal = Number(estimate.subtotal);
  const markup = round2((subtotal * Number(estimate.markup_pct)) / 100);
  const contingency = round2((subtotal * Number(estimate.contingency_pct)) / 100);

  return (
    <div className="mx-auto max-w-4xl bg-white p-10 print:p-0">
      <PrintButton />

      {/* Letterhead */}
      <header className="flex items-start justify-between border-b-2 border-[#0d4d6b] pb-4">
        <div>
          {/* print-color-adjust keeps the logo from being dropped when a
              browser prints with "background graphics" off. */}
          <Image
            src="/alpha-logo.png"
            alt={COMPANY.legalName}
            width={462}
            height={203}
            priority
            className="h-14 w-auto [print-color-adjust:exact] [-webkit-print-color-adjust:exact]"
          />
          <div className="mt-2 text-xs leading-relaxed text-slate-600">
            {COMPANY.address1}
            <br />
            {COMPANY.address2}
            <br />
            {COMPANY.phone} · {COMPANY.email}
            <br />
            {COMPANY.ccbLicense}
          </div>
        </div>
        <div className="text-right text-xs text-slate-600">
          <div className="text-sm font-semibold text-slate-900">Estimate</div>
          <div className="mt-1">
            Version {estimate.version}
            <br />
            {formatPacific(estimate.created_at, false)}
            <br />
            {estimate.status}
          </div>
        </div>
      </header>

      {/* Bid reference */}
      <section className="mt-6 grid grid-cols-2 gap-6 text-xs">
        <div>
          <div className="font-semibold uppercase tracking-wide text-slate-500">Prepared for</div>
          <div className="mt-1 leading-relaxed text-slate-800">
            {bid?.agency ?? "—"}
            {bid?.buyer_name && (
              <>
                <br />
                Attn: {bid.buyer_name}
              </>
            )}
            {bid?.buyer_email && (
              <>
                <br />
                {bid.buyer_email}
              </>
            )}
          </div>
        </div>
        <div>
          <div className="font-semibold uppercase tracking-wide text-slate-500">Solicitation</div>
          <div className="mt-1 leading-relaxed text-slate-800">
            {bid?.source_bid_number ?? "—"}
            <br />
            {bid?.title ?? "—"}
            <br />
            Closes {formatPacific(bid?.close_at)}
          </div>
        </div>
      </section>

      {/* Cover letter */}
      {estimate.narrative && (
        <section className="mt-8 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
          {estimate.narrative}
        </section>
      )}

      {/* Line items */}
      <section className="mt-8">
        <h2 className="border-b border-[#4cc4e0] pb-1 text-xs font-semibold uppercase tracking-wide text-[#0d4d6b]">
          Schedule of values
        </h2>
        <table className="mt-2 w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-300 text-left">
              <th className="py-1.5 pr-2 font-semibold">Item</th>
              <th className="py-1.5 pr-2 font-semibold">Description</th>
              <th className="py-1.5 pr-2 text-right font-semibold">Qty</th>
              <th className="py-1.5 pr-2 font-semibold">Unit</th>
              <th className="py-1.5 pr-2 text-right font-semibold">Unit price</th>
              <th className="py-1.5 text-right font-semibold">Extended</th>
            </tr>
          </thead>
          <tbody>
            {(estimate.line_items ?? []).map((li, i) => (
              <tr key={i} className="border-b border-slate-200 align-top">
                <td className="py-1.5 pr-2 font-mono text-[10px] text-slate-500">
                  {li.item_code ?? "—"}
                </td>
                <td className="py-1.5 pr-2">
                  {li.description}
                  {li.assumptions && (
                    <div className="text-[10px] italic text-slate-500">{li.assumptions}</div>
                  )}
                </td>
                <td className="py-1.5 pr-2 text-right tabular-nums">
                  {li.qty}
                  {!li.qty_from_docs && <span className="text-slate-400"> *</span>}
                </td>
                <td className="py-1.5 pr-2">{li.unit}</td>
                <td className="py-1.5 pr-2 text-right tabular-nums">{usd(li.unit_price)}</td>
                <td className="py-1.5 text-right tabular-nums">{usd(li.extended)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} />
              <td className="py-1.5 pr-2 text-right">Subtotal</td>
              <td className="py-1.5 text-right tabular-nums">{usd(subtotal)}</td>
            </tr>
            <tr>
              <td colSpan={4} />
              <td className="py-1.5 pr-2 text-right">Overhead and profit {estimate.markup_pct}%</td>
              <td className="py-1.5 text-right tabular-nums">{usd(markup)}</td>
            </tr>
            <tr>
              <td colSpan={4} />
              <td className="py-1.5 pr-2 text-right">Contingency {estimate.contingency_pct}%</td>
              <td className="py-1.5 text-right tabular-nums">{usd(contingency)}</td>
            </tr>
            <tr className="border-t-2 border-[#0d4d6b] text-sm font-bold">
              <td colSpan={4} />
              <td className="py-2 pr-2 text-right">Total</td>
              <td className="py-2 text-right tabular-nums">{usd(estimate.total)}</td>
            </tr>
          </tfoot>
        </table>
        {(estimate.line_items ?? []).some((li) => !li.qty_from_docs) && (
          <p className="mt-2 text-[10px] italic text-slate-500">
            * Quantity assumed — not stated in the bid documents. See assumptions below.
          </p>
        )}
      </section>

      {estimate.assumptions && (
        <section className="mt-6 break-inside-avoid">
          <h2 className="border-b border-[#4cc4e0] pb-1 text-xs font-semibold uppercase tracking-wide text-[#0d4d6b]">
            Assumptions
          </h2>
          <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-slate-800">
            {estimate.assumptions}
          </p>
        </section>
      )}

      {estimate.exclusions && (
        <section className="mt-6 break-inside-avoid">
          <h2 className="border-b border-[#4cc4e0] pb-1 text-xs font-semibold uppercase tracking-wide text-[#0d4d6b]">
            Exclusions
          </h2>
          <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-slate-800">
            {estimate.exclusions}
          </p>
        </section>
      )}

      <footer className="mt-10 border-t border-slate-300 pt-4 text-xs text-slate-600">
        <div className="mb-1 font-semibold text-[#0d4d6b]">{COMPANY.legalName}</div>
        <div className="font-semibold text-slate-900">{COMPANY.signer.name}</div>
        <div>{COMPANY.signer.title}</div>
        <div>
          {COMPANY.signer.email} · {COMPANY.signer.phone}
        </div>
        {printableLicenses.length > 0 && (
          <div className="mt-3 text-[10px] text-slate-500">{printableLicenses.join(" · ")}</div>
        )}
      </footer>
    </div>
  );
}
