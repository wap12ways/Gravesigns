/**
 * Alpha Environmental Services LLC — company identity.
 *
 * Everything the estimate package prints about *us* lives here. Edit this one
 * file; nothing else needs to change.
 *
 * TODO(alpha): replace the placeholder values below with the real ones.
 */

export const COMPANY = {
  legalName: "Alpha Environmental Services LLC", // TODO(alpha): confirm exact legal name
  shortName: "Alpha Environmental",
  address1: "TODO: street address",
  address2: "Portland, OR 97XXX",
  phone: "(503) 000-0000", // TODO(alpha)
  email: "estimating@example.com", // TODO(alpha)
  website: "", // optional

  /** Oregon CCB license number, printed on the estimate cover page. */
  ccbLicense: "TODO: CCB #",

  /** Other licences / certifications worth printing under the letterhead. */
  licenses: [
    "TODO: Oregon DEQ Asbestos Abatement Contractor Licence #",
    "TODO: AHERA accreditations held",
    "TODO: Oregon Lead-Based Paint (LBP) certification #",
  ],

  /** Who signs the cover letter. */
  signer: {
    name: "TODO: signer name",
    title: "Estimator",
    email: "estimating@example.com",
    phone: "(503) 000-0000",
  },
} as const;

/**
 * The contractor profile handed to Claude for fit scoring. Keep it factual and
 * current — this text is what the model reasons against, so editing it changes
 * every score from that point on.
 */
export const CONTRACTOR_PROFILE = `Portland, Oregon environmental services contractor.

Self-performed work:
- Asbestos abatement (friable and non-friable, NESHAP work)
- Lead abatement and lead-safe renovation
- Mold remediation
- Hazardous materials removal and disposal
- Selective and interior demolition
- Industrial hygiene support (air monitoring, clearances via third-party CIH)
- Site cleanup, decontamination, encapsulation

Geography: works statewide in Oregon. Strong preference for the Portland metro
area, then the Willamette Valley, then SW Washington border counties (Clark,
Cowlitz, Skamania, Klickitat). Eastern and coastal Oregon are workable but
carry travel and per-diem cost.

Typical project size: $25,000 to $500,000. Comfortable down to about $10,000
and up to roughly $1,000,000 with bonding in place.

Typically NOT a fit: new construction general contracting, civil/heavy highway,
paving, landscaping, IT and professional services, supply-only commodity bids,
and staffing contracts.`;

/** Estimate defaults. Editable per-estimate in the UI. */
export const ESTIMATE_DEFAULTS = {
  markupPct: 18,
  contingencyPct: 8,
} as const;
