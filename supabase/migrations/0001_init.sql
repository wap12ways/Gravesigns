-- Alpha Environmental — OregonBuys bid estimator
-- Run this once in the Supabase SQL editor (or `supabase db push`).
--
-- Every table here is written and read exclusively by the Next.js server using
-- the service role key. RLS is enabled with no permissive policies, so the
-- anon/public key can read nothing even if it leaks.

create extension if not exists "pgcrypto";

-- ── solicitations ────────────────────────────────────────────────────────────
create table if not exists solicitations (
  id                uuid primary key default gen_random_uuid(),
  source_bid_number text not null unique,
  title             text,
  agency            text,
  buyer_name        text,
  buyer_email       text,
  posted_at         timestamptz,
  close_at          timestamptz,
  status            text not null default 'open'
                      check (status in ('open', 'closed', 'awarded')),
  bid_url           text,
  description_raw   text,
  nigp_codes        text[] not null default '{}',
  location_text     text,
  county            text,
  scraped_at        timestamptz not null default now(),
  last_seen_at      timestamptz not null default now(),
  raw_html_hash     text,
  -- Bookkeeping so the UI can tell "never analysed" from "analysed, low score".
  import_source     text not null default 'scraper'
                      check (import_source in ('scraper', 'manual')),
  created_at        timestamptz not null default now()
);

create index if not exists solicitations_status_close_idx
  on solicitations (status, close_at);
create index if not exists solicitations_last_seen_idx
  on solicitations (last_seen_at desc);

-- ── solicitation_documents ───────────────────────────────────────────────────
create table if not exists solicitation_documents (
  id              uuid primary key default gen_random_uuid(),
  solicitation_id uuid not null references solicitations (id) on delete cascade,
  file_name       text not null,
  source_url      text,
  storage_path    text,
  mime_type       text,
  byte_size       bigint,
  page_count      int,
  text_extracted  boolean not null default false,
  extracted_text  text,
  extract_error   text,
  fetched_at      timestamptz not null default now()
);

-- One row per (bid, file). Lets the fetcher skip anything already downloaded.
create unique index if not exists solicitation_documents_unique
  on solicitation_documents (solicitation_id, file_name);

-- ── solicitation_analysis ────────────────────────────────────────────────────
create table if not exists solicitation_analysis (
  id                  uuid primary key default gen_random_uuid(),
  solicitation_id     uuid not null references solicitations (id) on delete cascade,
  fit_score           int check (fit_score between 0 and 100),
  bid_recommendation  text check (bid_recommendation in ('bid', 'review', 'no_bid')),
  reasons             jsonb not null default '[]'::jsonb,
  scope_summary       text,
  scope_items         jsonb not null default '[]'::jsonb,
  requirements        jsonb not null default '{}'::jsonb,
  estimated_size_band text,
  red_flags           jsonb not null default '[]'::jsonb,
  model               text,
  input_tokens        int,
  output_tokens       int,
  created_at          timestamptz not null default now()
);

-- Analyses are append-only; the newest row per bid is the live one.
create index if not exists solicitation_analysis_latest_idx
  on solicitation_analysis (solicitation_id, created_at desc);
create index if not exists solicitation_analysis_score_idx
  on solicitation_analysis (fit_score desc);

-- ── unit_prices ──────────────────────────────────────────────────────────────
create table if not exists unit_prices (
  id          uuid primary key default gen_random_uuid(),
  category    text not null
                check (category in ('asbestos', 'mold', 'radon', 'sewer', 'tank',
                                    'testing', 'lead', 'demo', 'hazmat', 'general')),
  item_code   text not null unique,
  description text not null,
  unit        text not null
                check (unit in ('sf', 'lf', 'ea', 'hr', 'day', 'ls', 'cy')),
  unit_cost   numeric(12, 2) not null default 0,
  unit_price  numeric(12, 2) not null default 0,
  notes       text,
  active      boolean not null default true,
  updated_at  timestamptz not null default now()
);

create index if not exists unit_prices_active_idx on unit_prices (active, category);

-- ── estimates ────────────────────────────────────────────────────────────────
create table if not exists estimates (
  id               uuid primary key default gen_random_uuid(),
  solicitation_id  uuid not null references solicitations (id) on delete cascade,
  version          int not null,
  status           text not null default 'draft'
                     check (status in ('draft', 'reviewed', 'submitted')),
  line_items       jsonb not null default '[]'::jsonb,
  subtotal         numeric(14, 2) not null default 0,
  markup_pct       numeric(6, 2) not null default 18,
  contingency_pct  numeric(6, 2) not null default 8,
  total            numeric(14, 2) not null default 0,
  assumptions      text,
  exclusions       text,
  narrative        text,
  model            text,
  submitted_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (solicitation_id, version)
);

create index if not exists estimates_solicitation_idx
  on estimates (solicitation_id, version desc);

-- ── scrape_runs ──────────────────────────────────────────────────────────────
create table if not exists scrape_runs (
  id           uuid primary key default gen_random_uuid(),
  trigger      text not null default 'cron' check (trigger in ('cron', 'manual')),
  started_at   timestamptz not null default now(),
  finished_at  timestamptz,
  bids_seen    int not null default 0,
  bids_matched int not null default 0,
  bids_new     int not null default 0,
  bids_closed  int not null default 0,
  docs_fetched int not null default 0,
  errors       jsonb not null default '[]'::jsonb,
  ok           boolean
);

create index if not exists scrape_runs_started_idx on scrape_runs (started_at desc);

-- ── scrape_seen ──────────────────────────────────────────────────────────────
-- A bid-number ledger, nothing more. Without it, every 4-hourly run would
-- re-fetch the detail page of all 25 listed bids just to re-reject the same
-- ones. This is not mirroring the site: no title, no content, just "we have
-- already looked at this bid and it was not ours".
create table if not exists scrape_seen (
  source_bid_number text primary key,
  doc_id            text,
  matched           boolean not null default false,
  first_seen_at     timestamptz not null default now(),
  last_seen_at      timestamptz not null default now()
);

-- ── claude_calls (token log) ─────────────────────────────────────────────────
create table if not exists claude_calls (
  id             uuid primary key default gen_random_uuid(),
  purpose        text not null,
  model          text not null,
  input_tokens   int,
  output_tokens  int,
  cache_read_tokens  int,
  duration_ms    int,
  attempts       int not null default 1,
  ok             boolean not null,
  error          text,
  ref_id         uuid,
  created_at     timestamptz not null default now()
);

create index if not exists claude_calls_created_idx on claude_calls (created_at desc);

-- ── keep updated_at honest ───────────────────────────────────────────────────
create or replace function touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists estimates_touch on estimates;
create trigger estimates_touch before update on estimates
  for each row execute function touch_updated_at();

drop trigger if exists unit_prices_touch on unit_prices;
create trigger unit_prices_touch before update on unit_prices
  for each row execute function touch_updated_at();

-- ── lock everything down ─────────────────────────────────────────────────────
-- No policies are created, so only the service role (which bypasses RLS) can
-- reach these tables. That is the whole access model for the prototype.
alter table solicitations          enable row level security;
alter table solicitation_documents enable row level security;
alter table solicitation_analysis  enable row level security;
alter table unit_prices            enable row level security;
alter table estimates              enable row level security;
alter table scrape_runs            enable row level security;
alter table scrape_seen            enable row level security;
alter table claude_calls           enable row level security;

-- ── storage bucket for bid attachments ───────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('bid-documents', 'bid-documents', false)
on conflict (id) do nothing;
