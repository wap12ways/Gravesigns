-- ─────────────────────────────────────────────────────────────────────────────
-- Restore the `demo` and `lead` price categories.
--
-- 0001 was written without them, on the basis that alphaenvironmental.net does
-- not advertise either. The public record says otherwise:
--
--   • Metro ITB 4313, May 2024 — Alpha WON a demolition project at $24,460,
--     the lowest of nine bidders.
--   • Metro ITB 4513, Jan 2026 — Alpha submitted a full 20-line demolition
--     unit price schedule for an on-call contract.
--   • Metro ITB 4489 (Aug 2025) and ITB 4512 (Nov 2025) — two more demo bids.
--   • FAA 697DCK25P00065, Jun 2025 — $78,095 for exterior LEAD PAINT
--     abatement at the Burns VOR site.
--   • ODOT PO-73000-00028113, Dec 2023 — asbestos and lead survey.
--
-- Run this in the SQL editor after 0001. Safe to run more than once.
-- ─────────────────────────────────────────────────────────────────────────────

alter table unit_prices drop constraint if exists unit_prices_category_check;

alter table unit_prices add constraint unit_prices_category_check
  check (category in ('asbestos', 'mold', 'radon', 'sewer', 'tank',
                      'testing', 'lead', 'demo', 'hazmat', 'general'));
