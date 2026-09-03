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

  /** Serving the Portland metro since — stated on alphaenvironmental.net. */
  established: 1999,

  /**
   * Credentials printed under the letterhead on every estimate.
   *
   * ONLY put things here that are true and checkable. This text goes to public
   * agency buyers, who do verify. Every line below is taken verbatim from
   * Alpha's own published claims.
   *
   * TODO(alpha): these are worth adding once you have the actual numbers —
   * they are real differentiators on public work, and the cover-letter prompt
   * is deliberately forbidden from inventing them:
   *   - Oregon DEQ asbestos abatement contractor licence number
   *   - AHERA accreditations held (supervisor, inspector, project designer)
   *   - Radon credentials (NRPP or NRSB certification number)
   *   - Bond and insurance limits, if a buyer asks for them up front
   * Add them as extra strings in this array; they print automatically.
   */
  licenses: [
    "Licensed Oregon DEQ service provider",
    "Licensed, bonded and insured",
    "Serving the Portland metro area since 1999",
  ],

  /** Who signs the cover letter. */
  signer: {
    name: "John Smith",
    title: "Estimator", // TODO(alpha): swap for John's real title if it differs
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
- Sanitary sewer extension and underground work (bid Clean Water Services
  project 7251 in 2024)

Demolition
- Structural and selective demolition, including foundations, slabs on grade
  and landscape features
- Site clearing, grubbing, backfill and grading
- Utility disconnection and removal
- Demolition debris removal and disposal
NOT on the website, but the public record is unambiguous: Alpha won Metro
ITB 4313 in 2024 at $24,460 as low bidder, bid Metro's on-call demolition
contract (ITB 4513) in January 2026 with a full unit price schedule, and bid
two further Metro demolition jobs during 2025. Alpha's real demolition unit
prices are loaded in the price book.

Lead
- Lead paint abatement, including exterior work
- Lead inspection, XRF testing and dust wipe sampling
Also absent from the website, also in the record: FAA contract
697DCK25P00065, June 2025, $78,095 for exterior lead paint abatement at the
Burns VOR site, and an ODOT asbestos and lead survey in 2023.

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

COMPETITIVE NOTE, from public bid tabulations. Alpha wins small, well-defined
demolition work — low bidder at $24,460 on Metro ITB 4313 — but has priced far
above the field on larger lump-sum demolition: $175,848 against a $28,750
winner on Metro ITB 4489, and $148,954 against $42,590 on ITB 4512. On
abatement Alpha is strong: highest-scored of six firms on Portland Community
College's district-wide hazardous materials abatement RFP (December 2025) and
a full-service asbestos abatement contract holder with Metro. Weigh a large
lump-sum demolition bid accordingly — flag it for review rather than treating
it as an easy win.

NOT A FIT: new construction general contracting, civil and heavy highway,
paving, landscaping, roofing, IT and software, professional consulting outside
the environmental field, food and commodity supply, staffing contracts.`;

/** Estimate defaults. Editable per-estimate in the UI. */
export const ESTIMATE_DEFAULTS = {
  markupPct: 18,
  contingencyPct: 8,
} as const;
