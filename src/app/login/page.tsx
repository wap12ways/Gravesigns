"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next") ?? "/";
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (response.ok) {
      router.push(next);
      router.refresh();
    } else {
      const body = await response.json().catch(() => ({ error: "Login failed" }));
      setError(body.error ?? "Login failed");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="w-full max-w-sm space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-white">Alpha Bid Desk</h1>
        <p className="mt-1 text-sm text-slate-400">OregonBuys bid intelligence and estimating.</p>
      </div>
      <input
        type="password"
        autoFocus
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        className="w-full rounded border border-ink-600 bg-ink-800 px-3 py-2 text-sm
                   text-white outline-none placeholder:text-slate-500
                   focus:border-alpha focus:ring-1 focus:ring-alpha"
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button type="submit" disabled={busy || !password} className="btn w-full">
        {busy ? "Checking…" : "Sign in"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-ink-900 px-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
