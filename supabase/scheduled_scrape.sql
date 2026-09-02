-- ─────────────────────────────────────────────────────────────────────────────
-- Four-hourly scrape, scheduled from Supabase.
--
-- WHY THIS EXISTS
-- Vercel's Hobby plan runs cron once per day, and that is all. This drives the
-- same endpoint every four hours using pg_cron and pg_net, both included on
-- Supabase's free tier. No extra service, no extra account, nothing to pay.
--
-- Use this OR .github/workflows/scrape.yml, not both. The Supabase route is
-- the better one if GitHub Actions is unavailable to you.
--
-- SETUP
--   1. Dashboard → Database → Extensions: enable `pg_cron` and `pg_net`.
--   2. Replace the two placeholders below.
--   3. Run this file in the SQL editor.
--
-- The daily cron in vercel.json can stay. A second sweep is harmless — the
-- scrape is idempotent, and scrape_seen means it re-fetches almost nothing.
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
