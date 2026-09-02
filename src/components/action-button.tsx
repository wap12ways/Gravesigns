"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * POST to an endpoint, show the error if there is one, refresh the page if
 * there is not. Used for Analyse and Generate Estimate, which are both
 * "kick off a Claude call and re-render" buttons.
 */
export function ActionButton({
  endpoint,
  label,
  busyLabel,
  variant = "primary",
  redirectKey,
  redirectTo,
}: {
  endpoint: string;
  label: string;
  busyLabel: string;
  variant?: "primary" | "ghost";
  /** Key in the JSON response holding an id to navigate to. */
  redirectKey?: string;
  /** Path template, `:id` replaced with the value at redirectKey. */
  redirectTo?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(endpoint, { method: "POST" });
      const text = await response.text();
      let body: Record<string, unknown> = {};
      try {
        body = JSON.parse(text);
      } catch {
        throw new Error(text.slice(0, 200) || `HTTP ${response.status}`);
      }
      if (!response.ok) throw new Error(String(body.error ?? `HTTP ${response.status}`));

      if (redirectKey && redirectTo && body[redirectKey]) {
        router.push(redirectTo.replace(":id", String(body[redirectKey])));
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={run}
        disabled={busy}
        className={variant === "primary" ? "btn" : "btn-ghost"}
      >
        {busy ? busyLabel : label}
      </button>
      {error && <span className="max-w-xs text-right text-2xs text-red-600">{error}</span>}
    </div>
  );
}
