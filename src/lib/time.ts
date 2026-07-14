/**
 * Resolve a local date + time of death (at a place) to a precise UTC instant.
 *
 * This is the piece that makes the Ascendant and houses trustworthy: given the
 * geocoded latitude/longitude we look up the civil IANA time zone (`tz-lookup`)
 * and convert the local wall-clock time on that historical date to UTC with
 * `luxon`, which applies daylight-saving and historical zone rules from the
 * IANA database. No external service, no account — the same approach desktop
 * astrology software uses. (For border-exact zone resolution, `geo-tz` could
 * replace `tz-lookup`; the coarser lookup is more than adequate at city level.)
 */
import tzlookup from "tz-lookup";
import { DateTime } from "luxon";

export interface DeathMoment {
  /** The resolved UTC instant of the chart */
  date: Date;
  /** Whether a real time-of-death (not the noon fallback) was supplied */
  timeKnown: boolean;
  /** The IANA time zone used, when a location was available */
  timezone: string | null;
}

export function resolveDeathMoment(
  dateOfDeath: string,
  timeOfDeath: string | null | undefined,
  latitude: number | null | undefined,
  longitude: number | null | undefined,
  /** Explicit IANA zone override; when set it wins over the geocoded lookup. */
  timezoneOverride?: string | null
): DeathMoment {
  const [y, m, d] = dateOfDeath.split("-").map(Number);
  const timeKnown = Boolean(timeOfDeath && /^\d{1,2}:\d{2}$/.test(timeOfDeath));
  const [hh, mm] = timeKnown
    ? (timeOfDeath as string).split(":").map(Number)
    : [12, 0];

  // Zone precedence: an explicit user override, else the geocoded location.
  let zone: string | null = null;
  if (timezoneOverride) {
    zone = timezoneOverride;
  } else if (typeof latitude === "number" && typeof longitude === "number") {
    try {
      zone = tzlookup(latitude, longitude);
    } catch {
      zone = null;
    }
  }

  if (zone) {
    const dt = DateTime.fromObject(
      { year: y, month: m, day: d, hour: hh, minute: mm },
      { zone }
    );
    if (dt.isValid) {
      return { date: new Date(dt.toMillis()), timeKnown, timezone: zone };
    }
  }

  // No zone (or invalid): treat the supplied clock time as UTC.
  return {
    date: new Date(Date.UTC(y, m - 1, d, hh, mm, 0)),
    timeKnown,
    timezone: null,
  };
}
