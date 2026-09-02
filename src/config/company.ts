/**
 * Alpha Environmental Services — company identity.
 *
 * Everything the estimate package prints about *us* lives here. Edit this one
 * file; nothing else needs to change.
 *
 * Facts below are taken from alphaenvironmental.net (verified 2026-09-02).
 */

export const COMPANY = {
  legalName: "Alpha Environmental Services",
  shortName: "Alpha Environmental",
  address1: "11080 SW Allen Blvd., #100",
  address2: "Beaverton, OR 97005",
  // The website lists (503) 292-5346 on every page. A screenshot from the
  // operator showed (503) 676-6327 — confirm which belongs on estimates.
  phone: "(503) 292-5346",
  email: "info@alphaenvironmental.net",
  website: "alphaenvironmental.net",

  /** Oregon CCB number, printed on the estimate cover page. */
  ccbLicense: "Oregon CCB License No. 152125",

  /** Other licences and accreditations worth printing under the letterhead. */
  licenses: [
    // TODO(alpha): fill these in — they are strong differentiators on public
    // work and the cover letter prompt is forbidden from inventing them.
    "TODO: Oregon DEQ asbestos abatement contractor licence #",
    "TODO: AHERA accreditations held (supervisor, inspector, project designer)",
    "TODO: Oregon radon measurement / mitigation credentials (NRPP or NRSB)",
  ],

  /** Who signs the cover letter. */
  signer: {
    name: "TODO: signer name",
    title: "Estimator",
    email: "info@alphaenvironmental.net",
    phone: "(503) 292-5346",
  },
} as const;

/**
 * The contractor profile handed to Claude for fit scoring.
 *
 * This is the single most consequential piece of text in the app — it is what
 * every score is measured against. It is written from Alpha's own published
 * service list, not from assumptions.
 *
 * Note the three-way split. Work in "self-performed" can score a straight
 * `bid`. Work in "adjacent" is deliberately routed to `review` rather than
 * `no_bid`, so a human decides. Work in "not a fit" is `no_bid`.
 */
export const CONTRACTOR_PROFILE = `Beaverton, Oregon environmental services company, family owned,
serving Portland and the surrounding metro area. Both a testing/consulting
practice and a licensed contractor (Oregon CCB 152125) — it wins work on both
sides, and a solicitation for surveys, sampling or monitoring is just as much
a fit as one for physical remediation.

SELF-PERFORMED — advertised services:

Asbestos
- Asbestos abatement
- Asbestos testing, surveys and bulk sampling

Mold
- Mold removal / remediation
- Mold testing and inspections

Radon
- Radon testing (short-term, long-term, continuous monitoring)
- Radon mitigation (sub-slab depressurization, crawlspace systems)

Storage tanks and soil
- Underground storage tank scanning and sweeps
- Tank decommissioning, in place and by removal
- Septic pumping and septic tank decommissioning
- Soil testing and sampling

Sewer
- Sewer video inspections
- Trenchless sewer repair (CIPP lining, pipe bursting)
- Sewer line cleaning

Testing and consulting (this half is as much a fit as the remediation half)
- Environmental surveys, bulk and air sampling, laboratory coordination
- Air monitoring and clearance testing
- Industrial hygiene support and indoor air quality assessment
- Inspection reports, DEQ reporting and site closure documentation

ADJACENT — plausible but NOT advertised. Score these as "review" so a human
decides, never "no_bid" on trade grounds alone:
- General hazardous materials removal and disposal (PCBs, universal waste,
  mercury devices, lab packs) where it is incidental to a tank, soil or
  abatement scope

GEOGRAPHY: Beaverton-based, so Washington and Multnomah counties are the home
ground, then Clackamas, then the rest of the Willamette Valley, then SW
Washington border counties (Clark, Cowlitz, Skamania, Klickitat). Eastern and
coastal Oregon are workable but carry travel and per-diem cost.

TYPICAL PROJECT SIZE: $10,000 to $500,000. Testing and survey contracts run
smaller than remediation and are still worth bidding — do not penalise a
$15,000 asbestos survey contract for being small.

NOT A FIT — Alpha does not self-perform these, so score "no_bid" on trade
grounds:
- Lead paint abatement and lead-safe renovation
- Demolition of any kind: structural, selective or interior

IMPORTANT on the two above. A solicitation is only a no_bid if the lead or
demolition work IS the job. Public work very often bundles our trade into a
demolition or renovation package — "pre-demolition asbestos survey and
abatement", "abate ACM prior to demolition by others", "lead and asbestos
survey". Where Alpha's own trade is a real, separable part of the scope, score
it on that part and recommend "bid" or "review", not "no_bid".

ALSO NOT A FIT: new construction general contracting, civil and heavy highway,
paving, landscaping, roofing, IT and software, professional consulting outside
the environmental field, food and commodity supply, staffing contracts.`;

/** Estimate defaults. Editable per-estimate in the UI. */
export const ESTIMATE_DEFAULTS = {
  markupPct: 18,
  contingencyPct: 8,
} as const;
