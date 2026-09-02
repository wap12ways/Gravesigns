-- ─────────────────────────────────────────────────────────────────────────────
-- OPTIONAL: scrape more often than once a day.
--
-- YOU PROBABLY DO NOT NEED THIS.
-- The daily sweep in vercel.json runs with no setup at all, and OregonBuys
-- posts few enough bids that a daily catch is plenty. /admin has a "Run
-- scraper" button for when you want one immediately.
--
-- Reach for this only if daily starts feeling slow — a bid with a seven-day
-- window is worth catching on day one, not day two. Vercel's Hobby plan will
-- not schedule more than once a day, so the extra sweeps come from pg_cron
-- and pg_net, both on Supabase's free tier. No new account, nothing to pay.
--
-- SETUP
--   1. Dashboard → Database → Extensions: enable `pg_cron` and `pg_net`.
--   2. Replace the two placeholders below.
--   3. Run this file in the SQL editor.
--
-- Leave the daily cron in vercel.json in place. Overlapping sweeps are
-- harmless: the scrape is idempotent, and scrape_seen means a second run in
-- the same day re-fetches almost nothing.
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Re-runnable: drop any previous version of this job first.
select cron.unschedule('oregonbuys-scrape')
where exists (select 1 from cron.job where jobname = 'oregonbuys-scrape');

select cron.schedule(
  'oregonbuys-scrape',
  '0 */4 * * *',
  $job$
    select net.http_get(
      url     := 'https://YOUR-PROJECT.vercel.app/api/cron/scrape',
      headers := jsonb_build_object(
        'Authorization', 'Bearer YOUR_CRON_SECRET',
        'User-Agent',    'AlphaEstimate-Scheduler/1.0'
      )
    );
  $job$
);

-- ── checking on it ───────────────────────────────────────────────────────────
--
-- The schedule:
--   select jobname, schedule, active from cron.job;
--
-- The last few firings (did pg_cron run the statement?):
--   select jobid, status, return_message, start_time
--   from cron.job_run_details
--   order by start_time desc limit 10;
--
-- What the endpoint actually answered (did the scrape work?):
--   select id, status_code, content, created
--   from net._http_response
--   order by created desc limit 10;
--
-- pg_net is asynchronous and its default timeout is short, so a timed-out row
-- here is expected and harmless — the request still reached Vercel and the
-- function still ran to completion. /admin's scrape run log is the real
-- record of what happened.
--
-- To stop it:  select cron.unschedule('oregonbuys-scrape');
