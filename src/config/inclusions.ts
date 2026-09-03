/**
 * The inclusions and exclusions checklist that goes on every estimate.
 *
 * Public abatement solicitations almost always ask for these as a grid, not
 * prose. The City of Talent's asbestos RFQ (section 5.6) is typical: a row per
 * item, each marked Included / Excluded / N/A. Emitting a paragraph instead
 * means an estimator has to re-read it and hand-transfer the answers onto the
 * agency's form.
 *
 * Claude marks each row against the bid documents and may add bid-specific
 * rows, but these are always present so nothing routine gets silently dropped.
 * Edit this list to match how Alpha actually bids.
 */

export const STANDARD_INCLUSION_ITEMS = [
  "Permits, notifications and agency fees",
  "Prevailing wage and certified payroll reporting",
  "Mobilization, containment and site setup",
  "Air monitoring during abatement",
  "Final clearance testing and release documentation",
  "Transportation, disposal and waste manifests",
  "Abatement project design or work plan",
  "Temporary weather protection",
  "Generator, temporary power and fuel",
  "Payment and performance bonds",
  "Restoration or replacement of removed materials",
  "Work outside normal business hours",
] as const;

export type InclusionStatus = "included" | "excluded" | "na";

export const INCLUSION_STATUS_LABEL: Record<InclusionStatus, string> = {
  included: "Included",
  excluded: "Excluded",
  na: "N/A",
};
