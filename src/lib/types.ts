/** Shapes shared between the server modules and the UI. */

export type BidRecommendation = "bid" | "review" | "no_bid";
export type SolicitationStatus = "open" | "closed" | "awarded";
export type EstimateStatus = "draft" | "reviewed" | "submitted";
export type PriceUnit = "sf" | "lf" | "ea" | "hr" | "day" | "ls" | "cy";
export type PriceCategory =
  | "asbestos"
  | "mold"
  | "radon"
  | "sewer"
  | "tank"
  | "testing"
  | "lead"
  | "demo"
  | "hazmat"
  | "general";

export interface Solicitation {
  id: string;
  source_bid_number: string;
  title: string | null;
  agency: string | null;
  buyer_name: string | null;
  buyer_email: string | null;
  posted_at: string | null;
  close_at: string | null;
  status: SolicitationStatus;
  bid_url: string | null;
  description_raw: string | null;
  nigp_codes: string[];
  location_text: string | null;
  county: string | null;
  scraped_at: string;
  last_seen_at: string;
  raw_html_hash: string | null;
  import_source: "scraper" | "manual";
  created_at: string;
}

export interface SolicitationDocument {
  id: string;
  solicitation_id: string;
  file_name: string;
  source_url: string | null;
  storage_path: string | null;
  mime_type: string | null;
  byte_size: number | null;
  page_count: number | null;
  text_extracted: boolean;
  extracted_text: string | null;
  extract_error: string | null;
  fetched_at: string;
}

export interface ScopeItem {
  description: string;
  quantity: number | null;
  unit: string | null;
  location: string | null;
  material_type: string | null;
  notes: string | null;
}

export interface BidRequirements {
  site_walk: boolean;
  site_walk_date: string | null;
  mandatory_pre_bid: boolean;
  prevailing_wage: boolean;
  bond_required: boolean;
  bond_details: string | null;
  certifications: string[];
  insurance: string | null;
  questions_deadline: string | null;
  close_at: string | null;
}

export interface SolicitationAnalysis {
  id: string;
  solicitation_id: string;
  fit_score: number | null;
  bid_recommendation: BidRecommendation | null;
  reasons: string[];
  scope_summary: string | null;
  scope_items: ScopeItem[];
  requirements: BidRequirements | Record<string, never>;
  estimated_size_band: string | null;
  red_flags: string[];
  model: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  created_at: string;
}

export interface UnitPrice {
  id: string;
  category: PriceCategory;
  item_code: string;
  description: string;
  unit: PriceUnit;
  unit_cost: number;
  unit_price: number;
  notes: string | null;
  active: boolean;
  updated_at: string;
}

export interface LineItem {
  item_code: string | null;
  description: string;
  qty: number;
  unit: string;
  unit_price: number;
  extended: number;
  assumptions: string | null;
  /** true when the quantity came from the bid docs, false when we guessed. */
  qty_from_docs: boolean;
}

export interface Estimate {
  id: string;
  solicitation_id: string;
  version: number;
  status: EstimateStatus;
  line_items: LineItem[];
  subtotal: number;
  markup_pct: number;
  contingency_pct: number;
  total: number;
  assumptions: string | null;
  exclusions: string | null;
  narrative: string | null;
  model: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScrapeRun {
  id: string;
  trigger: "cron" | "manual";
  started_at: string;
  finished_at: string | null;
  bids_seen: number;
  bids_matched: number;
  bids_new: number;
  bids_closed: number;
  docs_fetched: number;
  errors: { stage: string; message: string }[];
  ok: boolean | null;
}
