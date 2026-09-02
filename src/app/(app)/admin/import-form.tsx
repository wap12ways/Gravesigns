"use client";

import { useState } from "react";
import Link from "next/link";

interface DocResult {
  fileName: string;
  status: "stored" | "skipped" | "failed";
  detail?: string;
}

interface Result {
  docId: string;
  solicitationId: string | null;
  bidNumber: string;
  title: string | null;
  isNew: boolean;
  matched: boolean;
  matchReasons: string[];
  documents: DocResult[];
  skippedReason?: string;
}

interface Response {
  imported?: number;
  results?: Result[];
  failures?: { docId: string; error: string }[];
  unrecognised?: string[];
  error?: string;
}

export function ImportForm() {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [response, setResponse] = useState<Response | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setResponse(null);
    try {
      const res = await fetch("/api/solicitations/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ input }),
      });
      setResponse(await res.json());
    } catch (error) {
      setResponse({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <div className="card-title">Import a bid by URL</div>
      <form onSubmit={submit} className="space-y-3 p-4">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={3}
          spellCheck={false}
          placeholder={"https://oregonbuys.gov/bso/external/bidDetail.sda?docId=S-435000-00017903&external=true\nor just  S-435000-00017903\nOne per line for several."}
          className="field font-mono text-2xs"
        />
        <div className="flex items-center gap-3">
          <button type="submit" disabled={busy || !input.trim()} className="btn">
            {busy ? "Fetching…" : "Import"}
          </button>
          <span className="text-2xs text-slate-500">
            One request every 2 seconds, so several bids take a moment.
          </span>
        </div>
      </form>

      {response && (
        <div className="border-t border-slate-200 p-4 text-sm">
          {response.error && <p className="text-red-600">{response.error}</p>}

          {response.results?.map((result) => (
            <div key={result.docId} className="mb-4 last:mb-0">
              <div className="flex flex-wrap items-baseline gap-2">
                <span
                  className={`rounded px-1.5 py-0.5 text-2xs font-semibold uppercase ${
                    result.isNew ? "bg-alpha text-white" : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {result.isNew ? "new" : "updated"}
                </span>
                <span className="font-mono text-2xs text-slate-500">{result.bidNumber}</span>
                {result.solicitationId ? (
                  <Link
                    href={`/solicitations/${result.solicitationId}`}
                    className="font-medium text-alpha hover:underline"
                  >
                    {result.title ?? "(no title)"}
                  </Link>
                ) : (
                  <span className="text-slate-700">{result.title ?? "(no title)"}</span>
                )}
              </div>

              {result.skippedReason && (
                <p className="mt-1 text-2xs text-amber-700">Skipped: {result.skippedReason}</p>
              )}
              {result.matchReasons.length > 0 && (
                <p className="mt-1 text-2xs text-slate-500">
                  Matched on {result.matchReasons.join(", ")}
                </p>
              )}

              <ul className="mt-1.5 space-y-0.5">
                {result.documents.map((doc) => (
                  <li key={doc.fileName} className="text-2xs">
                    <span
                      className={
                        doc.status === "failed"
                          ? "text-red-600"
                          : doc.status === "skipped"
                            ? "text-slate-400"
                            : "text-alpha-dark"
                      }
                    >
                      ● {doc.status}
                    </span>{" "}
                    <span className="text-slate-700">{doc.fileName}</span>
                    {doc.detail && <span className="text-slate-500"> — {doc.detail}</span>}
                  </li>
                ))}
                {result.documents.length === 0 && (
                  <li className="text-2xs text-slate-400">No attachments on this bid.</li>
                )}
              </ul>
            </div>
          ))}

          {response.failures?.map((failure) => (
            <p key={failure.docId} className="text-2xs text-red-600">
              {failure.docId}: {failure.error}
            </p>
          ))}
          {response.unrecognised?.length ? (
            <p className="mt-2 text-2xs text-amber-700">
              Not recognised as a bid: {response.unrecognised.join(", ")}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
