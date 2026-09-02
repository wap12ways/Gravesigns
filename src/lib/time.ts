/**
 * OregonBuys prints every date in Pacific time with no zone marker, e.g.
 * "09/23/2026 02:00:00 PM". These helpers turn that into a real instant.
 *
 * No date library: Intl already knows the DST rules, so we ask it what the
 * Pacific offset is on the date in question and apply it.
 */

const OREGON_TZ = "America/Los_Angeles";

/** Offset in minutes that `America/Los_Angeles` is behind UTC at `utcGuess`. */
function pacificOffsetMinutes(utcGuess: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: OREGON_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(utcGuess);

  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") % 24,
    get("minute"),
    get("second"),
  );
  return (utcGuess.getTime() - asUtc) / 60_000;
}

/**
 * Parse "MM/DD/YYYY", "MM/DD/YYYY hh:mm:ss AM" or "MM/DD/YYYY HH:mm:ss"
 * as Pacific time. Returns an ISO string, or null if it does not look like
 * a date at all.
 */
export function parseOregonDate(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const text = raw.replace(/ /g, " ").trim();

  const match = text.match(
    /(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?)?/i,
  );
  if (!match) return null;

  const [, mm, dd, yyyy, hh, mi, ss, meridiem] = match;
  let hour = hh ? Number(hh) : 0;
  if (meridiem) {
    const upper = meridiem.toUpperCase();
    if (upper === "PM" && hour < 12) hour += 12;
    if (upper === "AM" && hour === 12) hour = 0;
  }

  // Treat the wall-clock reading as UTC, then correct by the Pacific offset.
  // Two passes so a time that lands near a DST boundary still resolves.
  const naive = Date.UTC(
    Number(yyyy),
    Number(mm) - 1,
    Number(dd),
    hour,
    mi ? Number(mi) : 0,
    ss ? Number(ss) : 0,
  );
  let instant = new Date(naive + pacificOffsetMinutes(new Date(naive)) * 60_000);
  instant = new Date(naive + pacificOffsetMinutes(instant) * 60_000);

  return Number.isNaN(instant.getTime()) ? null : instant.toISOString();
}

/** Whole days from now until `iso`. Negative once it has passed. */
export function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (Number.isNaN(ms)) return null;
  return Math.ceil(ms / 86_400_000);
}

/** "Sep 23, 2026 2:00 PM" in Pacific time — how the buyer reads it. */
export function formatPacific(iso: string | null | undefined, withTime = true): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: OREGON_TZ,
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  }).format(date);
}
