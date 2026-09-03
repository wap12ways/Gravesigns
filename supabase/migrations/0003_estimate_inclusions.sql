-- ─────────────────────────────────────────────────────────────────────────────
-- Structured inclusions / exclusions on estimates.
--
-- Agencies ask for these as a grid — a row per item marked Included, Excluded
-- or N/A — not as prose. See section 5.6 of the City of Talent asbestos RFQ,
-- which is typical. The free-text `assumptions` and `exclusions` columns stay
-- for everything that does not fit a row.
--
-- Run after 0002. Safe to run more than once.
-- ─────────────────────────────────────────────────────────────────────────────

alter table estimates
  add column if not exists inclusions jsonb not null default '[]'::jsonb;
