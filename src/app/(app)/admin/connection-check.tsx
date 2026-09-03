import { createClient } from "@supabase/supabase-js";

/**
 * Connection check.
 *
 * "Invalid API key" from Supabase tells you nothing about which of the three
 * likely causes you have: a key from the wrong project, a truncated paste, or
 * the publishable key where the secret one belongs. This panel says which.
 *
 * It prints no secret — only whether a value is present, its first few
 * characters (enough to tell a key type apart) and its length.
 */

interface Check {
  label: string;
  ok: boolean;
  detail: string;
  hint?: string;
}

function describeKey(value: string | undefined): { kind: string; shape: string } {
  if (!value) return { kind: "missing", shape: "not set" };
  const v = value.trim();
  const shape = `${v.slice(0, 12)}… · ${v.length} chars`;
  if (v.startsWith("sb_secret_")) return { kind: "secret (new format)", shape };
  if (v.startsWith("sb_publishable_")) return { kind: "PUBLISHABLE — wrong key", shape };
  if (v.startsWith("eyJ")) {
    // Legacy keys are JWTs; the role sits in the payload.
    try {
      const payload = JSON.parse(Buffer.from(v.split(".")[1], "base64").toString());
      return { kind: `legacy JWT, role "${payload.role}"`, shape };
    } catch {
      return { kind: "legacy JWT (unreadable)", shape };
    }
  }
  return { kind: "unrecognised format", shape };
}

export async function ConnectionCheck() {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const anthropic = process.env.ANTHROPIC_API_KEY?.trim();

  const checks: Check[] = [];

  // ── SUPABASE_URL ──
  let urlHost: string | null = null;
  try {
    urlHost = url ? new URL(url).host : null;
  } catch {
    urlHost = null;
  }
  checks.push({
    label: "SUPABASE_URL",
    ok: Boolean(urlHost?.endsWith(".supabase.co")),
    detail: urlHost ?? (url ? `not a valid URL: ${url}` : "not set"),
    hint: urlHost ? undefined : "Should look like https://<project-ref>.supabase.co",
  });

  // ── the key itself ──
  const described = describeKey(key);
  const keyLooksRight =
    described.kind.startsWith("secret") || described.kind.includes('role "service_role"');
  checks.push({
    label: "SUPABASE_SERVICE_ROLE_KEY",
    ok: keyLooksRight,
    detail: `${described.kind} · ${described.shape}`,
    hint: keyLooksRight
      ? undefined
      : described.kind === "missing"
        ? "Not set on this deployment."
        : 'This is not a service-role key. On the Supabase API Keys page take the ' +
          '"service_role" key (legacy tab) or a "secret" key — never the publishable or anon one.',
  });

  // ── do the two actually belong together? ──
  const refFromUrl = urlHost?.split(".")[0] ?? null;
  let refFromKey: string | null = null;
  if (key?.startsWith("eyJ")) {
    try {
      refFromKey = JSON.parse(Buffer.from(key.split(".")[1], "base64").toString()).ref ?? null;
    } catch {
      refFromKey = null;
    }
  }
  if (refFromUrl && refFromKey) {
    checks.push({
      label: "URL and key are the same project",
      ok: refFromUrl === refFromKey,
      detail: refFromUrl === refFromKey ? refFromUrl : `URL is ${refFromUrl}, key is ${refFromKey}`,
      hint:
        refFromUrl === refFromKey
          ? undefined
          : "The key belongs to a different Supabase project than the URL. Copy the key from the project the URL points at.",
    });
  }

  // ── the live round trip ──
  if (url && key) {
    try {
      const probe = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { count, error } = await probe
        .from("unit_prices")
        .select("*", { count: "exact", head: true });

      if (error) {
        checks.push({
          label: "Database round trip",
          ok: false,
          detail: error.message,
          hint:
            error.message.toLowerCase().includes("invalid api key")
              ? "Supabase rejected the key outright. Re-copy it from the API Keys page of THIS project."
              : error.message.toLowerCase().includes("does not exist")
                ? "Connected, but the tables are missing. Run supabase/migrations/0001_init.sql."
                : undefined,
        });
      } else {
        checks.push({
          label: "Database round trip",
          ok: true,
          detail: `connected · ${count ?? 0} unit prices loaded`,
          hint: count === 0 ? "Tables exist but are empty. Run supabase/seed/unit_prices.sql." : undefined,
        });
      }
    } catch (error) {
      checks.push({
        label: "Database round trip",
        ok: false,
        detail: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // ── Anthropic ──
  checks.push({
    label: "ANTHROPIC_API_KEY",
    ok: Boolean(anthropic?.startsWith("sk-ant-")),
    detail: anthropic
      ? `${anthropic.slice(0, 11)}… · ${anthropic.length} chars`
      : "not set",
    hint: anthropic
      ? undefined
      : "Needed for Analyse and Generate estimate. The scraper works without it.",
  });

  const allOk = checks.every((c) => c.ok);

  return (
    <div className="card">
      <div className="card-title flex items-center justify-between">
        <span>Connection check</span>
        <span className={allOk ? "text-alpha-dark" : "text-red-600"}>
          {allOk ? "all good" : "needs attention"}
        </span>
      </div>
      <ul className="divide-y divide-slate-200">
        {checks.map((check) => (
          <li key={check.label} className="px-4 py-2.5 text-sm">
            <div className="flex items-baseline gap-2">
              <span className={check.ok ? "text-alpha-dark" : "text-red-600"}>
                {check.ok ? "✓" : "✕"}
              </span>
              <span className="font-medium text-slate-800">{check.label}</span>
              <span className="ml-auto truncate font-mono text-2xs text-slate-500">
                {check.detail}
              </span>
            </div>
            {check.hint && <p className="mt-1 pl-5 text-2xs text-amber-700">{check.hint}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
