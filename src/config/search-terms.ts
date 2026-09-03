/**
 * Terms the scraper searches OregonBuys for.
 *
 * This is a different job from src/config/filters.ts. These terms go to
 * OregonBuys' own search box to find candidate bids across the whole open
 * list; the KEYWORDS in filters.ts then decide what to keep once we have read
 * the detail page. A term here that is too broad only costs a wasted search,
 * not a wrong decision.
 *
 * Each term is two HTTP requests, spaced 2 seconds apart, so keep the list
 * tight. Ordered by how likely a term is to surface work Alpha wants, because
 * a run that hits its time budget stops partway down.
 */

export interface SearchTerm {
  /** "desc" searches the bid title, "itemDesc" the line-item descriptions. */
  field: "desc" | "itemDesc";
  term: string;
}

export const SEARCH_TERMS: SearchTerm[] = [
  { field: "desc", term: "asbestos" },
  { field: "itemDesc", term: "asbestos" },
  { field: "desc", term: "abatement" },
  { field: "itemDesc", term: "abatement" },
  { field: "desc", term: "mold" },
  { field: "desc", term: "radon" },
  { field: "desc", term: "remediation" },
  { field: "desc", term: "demolition" },
  { field: "itemDesc", term: "demolition" },
  { field: "desc", term: "storage tank" },
  { field: "desc", term: "hazardous" },
  { field: "desc", term: "environmental" },
  { field: "desc", term: "sewer" },
  { field: "desc", term: "septic" },
];
