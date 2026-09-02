/**
 * Single-password gate for the whole app.
 *
 * There are no user accounts. Posting the right APP_PASSWORD to /api/login
 * sets a signed, httpOnly cookie; middleware rejects every request without a
 * valid one. Web Crypto is used (not node:crypto) so the same code runs in
 * middleware on the Edge runtime and in Node route handlers.
 */

export const SESSION_COOKIE = "alpha_session";
const SESSION_DAYS = 14;

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET is not set.");
  return s;
}

async function sign(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** `<expiry ms>.<hmac>` */
export async function createSessionToken(): Promise<string> {
  const expires = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  return `${expires}.${await sign(String(expires))}`;
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [expires, mac] = token.split(".");
  if (!expires || !mac) return false;
  if (Number(expires) < Date.now()) return false;

  const expected = await sign(expires);
  // Constant-time compare. Both are hex of the same length.
  if (expected.length !== mac.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ mac.charCodeAt(i);
  return diff === 0;
}

export const SESSION_MAX_AGE = SESSION_DAYS * 24 * 60 * 60;
