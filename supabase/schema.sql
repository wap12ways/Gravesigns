-- ─────────────────────────────────────────────────────────────
-- GraveSigns — Supabase schema
-- Run this in the Supabase SQL editor (Dashboard → SQL → New query).
-- ─────────────────────────────────────────────────────────────

create extension if not exists "pgcrypto";

create table if not exists public.readings (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),

  full_name         text not null,
  subject_type      text not null default 'human'
                      check (subject_type in ('human', 'pet')),

  date_of_death     date not null,
  time_of_death     text,          -- 'HH:MM' (24h), nullable
  place             text,          -- free text: 'City, Country'
  latitude          double precision,
  longitude         double precision,
  notes             text,

  chart             jsonb not null,        -- the full calculated DeathChart
  reading_markdown  text not null,         -- the AI-composed reading
  dossier           jsonb,                 -- the Pass-A judgment dossier (nullable)
  natal_chart       jsonb,                 -- the natal chart when birth data given (nullable)
  ethics_review     jsonb,                 -- the Pass-E ethical-alignment record (nullable)
  study_notes       jsonb,                 -- the practitioner's study notes (nullable)
  model             text not null default 'claude-sonnet-5'
);

create index if not exists readings_created_at_idx
  on public.readings (created_at desc);

-- ── Migration for existing databases ─────────────────────────
-- If your `readings` table predates the multi-pass pipeline, add the
-- dossier, natal_chart, ethics_review, and study_notes columns (safe to run
-- repeatedly):
alter table public.readings add column if not exists dossier jsonb;
alter table public.readings add column if not exists natal_chart jsonb;
alter table public.readings add column if not exists ethics_review jsonb;
alter table public.readings add column if not exists study_notes jsonb;

-- ─────────────────────────────────────────────────────────────
-- Knowledge corpus
-- A general, versioned store of the practice's compiled reference material —
-- the proprietary compilation of public data the reading engine draws on. The
-- Code of Ethics is the first `kind` and the interpretive `delineation` corpus
-- the second (its factor-keyed entries ride in `metadata.entries`); later phases
-- add more kinds (association standards, articles, webinar transcripts,
-- published readings, case data) as new ROWS, with no schema change.
-- Kind-specific extras live in `metadata`, so new kinds never force a migration.
--
-- All bundled kinds fall back gracefully, so seeding here is optional — it just
-- makes the corpus editable in the DB without a redeploy. Row shapes mirror the
-- bundled documents:
--   • kind = 'delineation'      → metadata '{"entries":  [{"key":"moon:Scorpio","family":"moon", …}]}'
--   • kind = 'classical_source' → metadata '{"passages": [{"key":"significator:Saturn","work":"…","ref":"…","text":"…"}]}'
--                                  (verbatim public-domain excerpts) OR a bibliography row with no passages.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.knowledge_documents (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  slug          text not null,              -- 'ncgr-code-of-ethics'
  kind          text not null,              -- 'code_of_ethics', 'article', …
  title         text not null,
  source        text,                       -- URL or citation
  attribution   text,                       -- copyright / licence / rights
  version       text,                       -- publisher's version marker
  status        text not null default 'active'
                  check (status in ('active', 'archived', 'draft')),

  content       text not null,              -- the full document text (Markdown)
  sections      jsonb,                      -- optional structured breakdown
  metadata      jsonb not null default '{}'::jsonb,

  unique (slug, version)
);

create index if not exists knowledge_documents_kind_status_idx
  on public.knowledge_documents (kind, status);

-- The reading engine reads the corpus with the anon or service-role key, so a
-- public read policy lets it (and the demo UI) load active documents.
alter table public.knowledge_documents enable row level security;

drop policy if exists "knowledge is publicly readable" on public.knowledge_documents;
create policy "knowledge is publicly readable"
  on public.knowledge_documents for select
  using (true);

-- Seed the corpus with the bundled reference documents (idempotent):
--   \i supabase/seed/knowledge_documents.sql
-- or paste that file into the SQL editor after this schema.

-- ── Row Level Security ───────────────────────────────────────
-- The API routes use the SERVICE ROLE key, which bypasses RLS, so
-- writes always succeed server-side. We enable RLS and add a public
-- read policy so the demo "Previous Readings" gallery can render with
-- only the anon key if you prefer client-side reads. Tighten these
-- for production (e.g. per-user ownership).

alter table public.readings enable row level security;

drop policy if exists "readings are publicly readable" on public.readings;
create policy "readings are publicly readable"
  on public.readings for select
  using (true);

-- Optional: allow anonymous inserts (not required — the server uses the
-- service role key). Uncomment to permit client-side inserts as well.
-- drop policy if exists "anyone can insert a reading" on public.readings;
-- create policy "anyone can insert a reading"
--   on public.readings for insert
--   with check (true);
