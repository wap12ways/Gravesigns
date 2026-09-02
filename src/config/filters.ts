/**
 * What the scraper keeps.
 *
 * A bid is stored if its title or description matches any KEYWORD, or if any
 * of its NIGP codes appears in NIGP_CODES. Everything else on OregonBuys is
 * ignored — we do not mirror the whole site.
 *
 * The list covers both halves of Alpha's business: the remediation side
 * (abatement, removal, mitigation) and the testing/consulting side (surveys,
 * sampling, monitoring, inspections). Missing the testing half was the single
 * biggest gap in the original keyword list.
 */

/** Case-insensitive substring match against title + description. */
export const KEYWORDS = [
  // ── asbestos ──
  "asbestos",
  "abatement",
  "acm",
  "encapsulation",

  // ── mold and indoor air ──
  "mold",
  "remediation",
  "indoor air quality",
  "moisture intrusion",

  // ── radon ──
  "radon",

  // ── storage tanks, septic, soil ──
  "storage tank",
  "underground storage tank",
  "decommission",
  "septic",
  "soil sampling",
  "soil testing",
  "vapor intrusion",

  // ── sewer ──
  "sewer",
  "trenchless",
  "cipp",
  "pipe bursting",

  // ── hazardous materials ──
  "hazardous",
  "hazmat",
  "contaminat", // contaminated, contamination, contaminant
  "pcb",
  "universal waste",
  "decontamination",
  "removal and disposal",

  // ── testing, surveys and monitoring ──
  "hazardous materials survey",
  "hazardous building materials",
  "air monitoring",
  "clearance testing",
  "industrial hygiene",
  "environmental site assessment",
  "phase i esa",
  "phase ii esa",

  // ── adjacent work ──
  "lead",
  "demolition",
  "demo",
  "environmental",
  "cleanup",
];

/**
 * NIGP class-item codes to keep regardless of wording, e.g. "910-14".
 * Intentionally empty — fill this in after confirming the codes Alpha cares
 * about in the OregonBuys NIGP code lookup. A bare class ("910") matches every
 * item in that class.
 */
export const NIGP_CODES: string[] = [
  // "910-14",  // Asbestos abatement / removal services   <- verify before enabling
  // "926-45",  // Environmental testing services          <- verify before enabling
  // "968-30",  // Demolition services                     <- verify before enabling
];

/**
 * Words that, standing alone, generate too much noise to be worth a substring
 * match. "demo" hits "demonstration"; "lead" hits "lead time" and "team lead";
 * "acm" hits inside longer words. These are matched as whole words only.
 */
export const WHOLE_WORD_ONLY = new Set([
  "demo",
  "lead",
  "cleanup",
  "acm",
  "pcb",
  "cipp",
  "sewer",
  "radon",
  "septic",
]);

export function matchesKeywords(...texts: (string | null | undefined)[]): string[] {
  const haystack = texts.filter(Boolean).join(" \n ").toLowerCase();
  const hits: string[] = [];
  for (const kw of KEYWORDS) {
    const found = WHOLE_WORD_ONLY.has(kw)
      ? new RegExp(`\\b${kw}\\b`, "i").test(haystack)
      : haystack.includes(kw);
    if (found) hits.push(kw);
  }
  return hits;
}

export function matchesNigp(codes: string[] | null | undefined): string[] {
  if (!codes?.length || !NIGP_CODES.length) return [];
  return codes.filter((code) =>
    NIGP_CODES.some((want) => code === want || code.startsWith(`${want}-`)),
  );
}
