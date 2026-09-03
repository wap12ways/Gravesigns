import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * The one Supabase client in the app. Service role, server only.
 *
 * Nothing in src/lib may be imported from a client component — the service
 * role key bypasses RLS, so it must never reach the browser bundle.
 */

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let cached: SupabaseClient | null = null;

export function db(): SupabaseClient {
  if (!url || !serviceKey) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set. Copy .env.example to .env.local.",
    );
  }
  if (!cached) {
    cached = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}

export const BID_DOCS_BUCKET = "bid-documents";

/** True when Supabase is configured. Used by /intake to show a clear message. */
export function isDbConfigured(): boolean {
  return Boolean(url && serviceKey);
}
