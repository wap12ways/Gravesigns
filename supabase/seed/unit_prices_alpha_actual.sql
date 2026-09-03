-- ─────────────────────────────────────────────────────────────────────────────
-- ALPHA'S REAL UNIT PRICES — not placeholders.
--
-- Source: Oregon Metro, ITB 4513 "On-Call Demolition Services", bid tabulation
-- for the opening of 8 January 2026. These are the prices Alpha Environmental
-- Services actually submitted. Public record:
--   https://bidlocker.us/r/pdx/details/5486_Itb_4513_On_Call_Demolition_Services
--
-- Alpha placed 5th of 13 and was not awarded; the prices are still Alpha's own
-- and are the best real anchor available for the demolition side of the book.
--
-- unit_price holds the submitted bid price. unit_cost is left at 0 because
-- Alpha's internal cost is not public — enter your real cost to make the
-- margin column on /prices mean anything.
--
-- Run AFTER 0002_restore_demo_and_lead.sql. Safe to run more than once, and it
-- will not overwrite a rate you have since edited by hand.
-- ─────────────────────────────────────────────────────────────────────────────

insert into unit_prices (category, item_code, description, unit, unit_cost, unit_price, notes) values
('demo','DEMO-MOB','Mobilization','ea',0,3500.00,'ACTUAL — Alpha bid, Metro ITB 4513, 08 Jan 2026. Sell price only; cost not public.'),
('demo','DEMO-EROSION','Erosion control, temporary and final, seeding and straw cover','sf',0,1.00,'ACTUAL — Alpha bid, Metro ITB 4513, 08 Jan 2026. Sell price only; cost not public.'),
('demo','DEMO-TREE','Tree protection','ea',0,1000.00,'ACTUAL — Alpha bid, Metro ITB 4513, 08 Jan 2026. Sell price only; cost not public.'),
('demo','DEMO-CLEAR','Clearing and grubbing','sf',0,2.50,'ACTUAL — Alpha bid, Metro ITB 4513, 08 Jan 2026. Sell price only; cost not public.'),
('demo','DEMO-BLDG-1ST','Demolish single story, or first floor of multi-story, complete','sf',0,16.50,'ACTUAL — Alpha bid, Metro ITB 4513, 08 Jan 2026. Sell price only; cost not public.'),
('demo','DEMO-BLDG-UPPER','Demolish second story and each additional story, complete','sf',0,18.75,'ACTUAL — Alpha bid, Metro ITB 4513, 08 Jan 2026. Sell price only; cost not public.'),
('demo','DEMO-FOUNDATION','Demolish concrete foundations, basement, vaults, incl. reinforcing','sf',0,4.50,'ACTUAL — Alpha bid, Metro ITB 4513, 08 Jan 2026. Sell price only; cost not public.'),
('demo','DEMO-SLAB-OG','Demolish concrete slab on grade, patio, sidewalk, incl. reinforcing','sf',0,4.50,'ACTUAL — Alpha bid, Metro ITB 4513, 08 Jan 2026. Sell price only; cost not public.'),
('demo','DEMO-SEPTIC','Decommission, remove, haul and dispose septic system incl. inlet and leach lines','ea',0,7500.00,'ACTUAL — Alpha bid, Metro ITB 4513, 08 Jan 2026. Note: TNK-SEPTIC-DECOM is a placeholder for the same work; prefer this one.'),
('demo','DEMO-UTIL-DISCONNECT','Disconnection of utilities: gas, electrical, water, telecom, sewer','ea',0,250.00,'ACTUAL — Alpha bid, Metro ITB 4513, 08 Jan 2026. Sell price only; cost not public.'),
('demo','DEMO-UTIL-REMOVE','Demolition, removal, hauling and disposal of utilities','ea',0,250.00,'ACTUAL — Alpha bid, Metro ITB 4513, 08 Jan 2026. Sell price only; cost not public.'),
('demo','DEMO-LANDSCAPE-FEAT','Demolish landscape features incl. pavers, decorative stone, furniture','sf',0,3.50,'ACTUAL — Alpha bid, Metro ITB 4513, 08 Jan 2026. Sell price only; cost not public.'),
('demo','DEMO-DEBRIS','Removal, hauling and disposal of demolition debris','cy',0,150.00,'ACTUAL — Alpha bid, Metro ITB 4513, 08 Jan 2026. Sell price only; cost not public.'),
('demo','DEMO-DEBRIS-HAND','Hand removal, hauling and disposal of demolition debris','sf',0,4.50,'ACTUAL — Alpha bid, Metro ITB 4513, 08 Jan 2026. Sell price only; cost not public.'),
('demo','DEMO-FENCE-WALL','Demolish landscape, fencing, gates, retaining walls, boulders, decorative rock','lf',0,4.50,'ACTUAL — Alpha bid, Metro ITB 4513, 08 Jan 2026. Sell price only; cost not public.'),
('demo','DEMO-BACKFILL','Backfill and grading, incl. compaction and/or soil scarification','sf',0,2.25,'ACTUAL — Alpha bid, Metro ITB 4513, 08 Jan 2026. Sell price only; cost not public.'),
('demo','DEMO-ADMIN','Construction administration: overhead, profit, insurance, other','ea',0,5000.00,'ACTUAL — Alpha bid, Metro ITB 4513, 08 Jan 2026. Note: this already carries overhead and profit, so do not also apply the estimate markup to it.'),
-- Alpha bid permitting as a 15% mark-up on cost rather than a unit rate. Carried
-- as a line so an estimator sees it; set the quantity to the permit cost.
('demo','DEMO-PERMIT-MU','Permitting mark-up — Alpha bid 15% on permit cost (enter permit cost as qty)','ls',0,0.15,'ACTUAL — Alpha bid, Metro ITB 4513, 08 Jan 2026: 15% mark-up, not a fixed fee.')
on conflict (item_code) do update set
  description = excluded.description,
  unit        = excluded.unit,
  unit_price  = excluded.unit_price,
  notes       = excluded.notes
-- Refresh only rows still carrying our own note. Once you edit a rate and
-- clear the note, re-running this leaves it alone.
where unit_prices.notes like 'ACTUAL — Alpha bid, Metro ITB 4513%'
   or unit_prices.notes like 'PLACEHOLDER%';
