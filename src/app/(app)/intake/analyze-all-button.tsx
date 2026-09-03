"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Result {
  bidNumber: string;
  title: string | null;
  ok: boolean;
  detail: string;
}

export function AnalyzeAllButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/analyze/batch", { method: "POST" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? `HTTP ${response.status}`);
      // Accumulate across presses, so a second run reads as one list.
      setResults((current) => [...current, ...(body.results ?? [])]);
      setRemaining(body.remaining ?? 0);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <div className="card-title">Analyse everything unscored</div>
      <div className="space-y-3 p-4 text-sm">
        <p className="text-slate-600">
          Scores every solicitation that has never been analysed, one after another.
          Roughly 30 seconds and 6 cents each. It stops after four minutes so the
          request is not cut off — if anything is left, press it again.
        </p>
        <button onClick={run} disabled={busy} className="btn">
          {busy ? "Analysing… (leave this tab open)" : "Analyse all"}
        </button>

        {remaining !== null && !busy && (
          <p className={remaining > 0 ? "text-2xs text-amber-700" : "text-2xs text-alpha-dark"}>
            {remaining > 0
              ? `${remaining} still unscored — press Analyse all again.`
              : "Everything is scored."}
          </p>
        )}
        {error && <p className="text-2xs text-red-600">{error}</p>}

        {results.length > 0 && (
          <ul className="max-h-64 space-y-1 overflow-y-auto rounded border border-slate-200 bg-slate-50 p-3">
            {results.map((result, i) => (
              <li key={`${result.bidNumber}-${i}`} className="text-2xs">
                <span className={result.ok ? "text-alpha-dark" : "text-red-600"}>
                  {result.ok ? "✓" : "✕"}
                </span>{" "}
                <span className="font-mono text-slate-500">{result.bidNumber}</span>{" "}
                <span className="text-slate-700">{(result.title ?? "").slice(0, 46)}</span>
                <div className="pl-4 text-slate-500">{result.detail}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
