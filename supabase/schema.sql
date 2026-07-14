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
  model             text not null default 'claude-sonnet-5'
);

create index if not exists readings_created_at_idx
  on public.readings (created_at desc);

-- ── Migration for existing databases ─────────────────────────
-- If your `readings` table predates the three-pass pipeline, add the
-- dossier and natal_chart columns (safe to run repeatedly):
alter table public.readings add column if not exists dossier jsonb;
alter table public.readings add column if not exists natal_chart jsonb;

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
