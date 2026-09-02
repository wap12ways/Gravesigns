import Link from "next/link";
import { notFound } from "next/navigation";
import { AnalysisPanel } from "@/components/analysis-panel";
import { ActionButton } from "@/components/action-button";
import { latestAnalysis } from "@/lib/analysis";
import { db } from "@/lib/supabase";
import { signedDocumentUrl } from "@/lib/oregonbuys/documents";
import { daysUntil, formatPacific } from "@/lib/time";
import type { Solicitation, SolicitationAnalysis, SolicitationDocument } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function SolicitationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = db();

  const { data: bid } = await supabase
    .from("solicitations")
    .select("*")
    .eq("id", id)
    .maybeSingle<Solicitation>();

  if (!bid) notFound();

  const { data: documents } = await supabase
    .from("solicitation_documents")
    .select("*")
    .eq("solicitation_id", id)
    .order("file_name");

  const docs = (documents ?? []) as SolicitationDocument[];
  const links = await Promise.all(
    docs.map(async (doc) => ({
      ...doc,
      href: doc.storage_path ? await signedDocumentUrl(doc.storage_path) : null,
    })),
  );

  const analysis = (await latestAnalysis(id)) as SolicitationAnalysis | null;
  const days = daysUntil(bid.close_at);

  return (
    <div className="space-y-4 p-6">
      <header className="card">
        <div className="flex flex-wrap items-start justify-between gap-4 p-4">
          <div className="min-w-0">
            <div className="font-mono text-2xs text-slate-500">{bid.source_bid_number}</div>
            <h1 className="mt-0.5 text-base font-semibold">{bid.title ?? "(no title)"}</h1>
            <div className="mt-1 text-sm text-slate-600">{bid.agency ?? "—"}</div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {bid.bid_url && (
              <a href={bid.bid_url} target="_blank" rel="noreferrer" className="btn-ghost">
                Open on OregonBuys ↗
              </a>
            )}
            <ActionButton
              endpoint={`/api/solicitations/${bid.id}/analyze`}
              label={analysis ? "Re-analyse" : "Analyse"}
              busyLabel="Analysing…"
              variant={analysis ? "ghost" : "primary"}
            />
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 border-t border-slate-200 p-4 text-sm sm:grid-cols-4">
          <Field label="Closes">
            {formatPacific(bid.close_at)}
            {days !== null && (
              <span
                className={`ml-1.5 text-2xs ${
                  days < 0 ? "text-slate-400" : days <= 5 ? "text-red-600" : "text-slate-500"
                }`}
              >
                {days < 0 ? "passed" : `${days}d`}
              </span>
            )}
          </Field>
          <Field label="Posted">{formatPacific(bid.posted_at, false)}</Field>
          <Field label="Status">{bid.status}</Field>
          <Field label="Source">{bid.import_source}</Field>
          <Field label="Buyer">{bid.buyer_name ?? "—"}</Field>
          <Field label="Buyer email">
            {bid.buyer_email ? (
              <a href={`mailto:${bid.buyer_email}`} className="text-alpha hover:underline">
                {bid.buyer_email}
              </a>
            ) : (
              "—"
            )}
          </Field>
          <Field label="County">{bid.county ?? "—"}</Field>
          <Field label="NIGP">{bid.nigp_codes?.join(", ") || "—"}</Field>
        </dl>

        {bid.description_raw && (
          <div className="border-t border-slate-200 p-4">
            <div className="text-2xs font-semibold uppercase tracking-wide text-slate-500">
              Description
            </div>
            <p className="mt-1.5 whitespace-pre-wrap text-sm text-slate-700">
              {bid.description_raw}
            </p>
          </div>
        )}

        {bid.location_text && (
          <div className="border-t border-slate-200 p-4">
            <div className="text-2xs font-semibold uppercase tracking-wide text-slate-500">
              Location
            </div>
            <p className="mt-1.5 whitespace-pre-wrap text-sm text-slate-700">{bid.location_text}</p>
          </div>
        )}
      </header>

      {analysis ? (
        <AnalysisPanel analysis={analysis} />
      ) : (
        <section className="card p-4 text-sm text-slate-600">
          Not analysed yet. Press <strong>Analyse</strong> to score this bid and pull the
          scope out of the documents.
        </section>
      )}

      <section className="card">
        <div className="card-title">Documents ({links.length})</div>
        <div className="overflow-x-auto">
          <table className="op-table">
            <thead>
              <tr>
                <th>File</th>
                <th>Type</th>
                <th className="text-right">Pages</th>
                <th className="text-right">Size</th>
                <th>Text</th>
              </tr>
            </thead>
            <tbody>
              {links.map((doc) => (
                <tr key={doc.id}>
                  <td>
                    {doc.href ? (
                      <a href={doc.href} target="_blank" rel="noreferrer" className="text-alpha hover:underline">
                        {doc.file_name}
                      </a>
                    ) : (
                      doc.file_name
                    )}
                  </td>
                  <td className="text-2xs text-slate-500">
                    {doc.mime_type?.replace("application/", "") ?? "—"}
                  </td>
                  <td className="text-right tabular-nums">{doc.page_count ?? "—"}</td>
                  <td className="text-right tabular-nums text-2xs text-slate-500">
                    {doc.byte_size ? `${Math.round(doc.byte_size / 1024)} KB` : "—"}
                  </td>
                  <td className="text-2xs">
                    {doc.text_extracted ? (
                      <span className="text-alpha-dark">
                        {doc.extracted_text?.length.toLocaleString()} chars
                      </span>
                    ) : (
                      <span className="text-amber-700">{doc.extract_error ?? "not extracted"}</span>
                    )}
                  </td>
                </tr>
              ))}
              {!links.length && (
                <tr>
                  <td colSpan={5} className="text-slate-500">
                    No documents stored for this bid.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-2xs text-slate-400">
        <Link href="/" className="hover:underline">
          ← Pipeline
        </Link>
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-2xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-0.5 truncate text-slate-800">{children}</dd>
    </div>
  );
}
