# Alpha Estimate

OregonBuys bid intelligence and estimating for **Alpha Environmental Services LLC**.

The app watches public solicitations on [OregonBuys](https://oregonbuys.gov/bso/),
scores them for fit against Alpha's trade profile, pulls the scope out of the bid
documents with Claude, and turns that scope into a priced estimate package ready
for review.

Alpha is both a testing/consulting practice and a licensed contractor
(Oregon CCB 152125), so the scoring treats a survey or air-monitoring contract
as just as good a fit as a remediation job. Published services: asbestos
abatement and testing; mold removal, testing and inspections; radon testing and
mitigation; underground storage tank scanning, decommissioning, septic and soil
testing; sewer inspections, trenchless repair and line cleaning.

It is a private operator tool. One password, no user accounts.

---

## Stack

| Piece | Choice |
| --- | --- |
| App | Next.js 15 (App Router, TypeScript) on Vercel |
| Data | Supabase Postgres — service role key, server side only |
| Files | Supabase Storage, private `bid-documents` bucket |
| AI | Anthropic API. Model ids live in `src/config/models.ts` |
| Schedule | Vercel Cron, once a day |
| Styling | Tailwind. No component library |

---

## Setup

### 1. Supabase

Create a project, then in **SQL Editor** run, in order:

1. `supabase/migrations/0001_init.sql` — tables, indexes, RLS lockdown, and the
   private `bid-documents` storage bucket.
2. `supabase/seed/unit_prices.sql` — 112 placeholder unit prices across ten
   categories: asbestos, mold, radon, sewer, tank, testing, lead, demo, hazmat
   and general conditions.

> Every rate in the seed is a **placeholder** with Portland-market-plausible
> numbers, flagged `PLACEHOLDER` in its `notes`. Replace them from `/prices`
> before quoting real work. Re-running the seed refreshes untouched placeholders
> and leaves anything you have edited alone.

Copy the project URL and the **service role** key from
*Project Settings → API Keys*.

### 2. Environment

```bash
cp .env.example .env.local
# then fill in the values
```

| Variable | What it is |
| --- | --- |
| `SUPABASE_URL` | `https://<ref>.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key. **Server only** — never `NEXT_PUBLIC_` |
| `ANTHROPIC_API_KEY` | From console.anthropic.com |
| `CRON_SECRET` | Bearer token the cron route requires. `openssl rand -hex 32` |
| `APP_PASSWORD` | The single password for the whole app |
| `SESSION_SECRET` | Signs the login cookie. `openssl rand -hex 32` |

### 3. Run

```bash
npm install
npm run dev      # http://localhost:3000
```

You will land on `/login`. Enter `APP_PASSWORD`.

### 4. Deploy

Import the repo in Vercel, set the same six variables under
*Settings → Environment Variables*, deploy. `vercel.json` registers a daily
cron against `/api/cron/scrape`; Vercel supplies the
`Authorization: Bearer $CRON_SECRET` header automatically.

#### Running on the free (Hobby) plan

Two Hobby limits shape the setup. Neither costs the app anything real:

| Limit | Effect | What we do |
| --- | --- | --- |
| **Cron runs once per day, max** | A `0 */4 * * *` expression **fails the deployment** with *"Hobby accounts are limited to daily cron jobs"* | `vercel.json` schedules the sweep daily, which is all this needs |
| **Cron timing is ±59 minutes** | A job set for 13:00 fires somewhere in the 13:00 hour | Irrelevant — bids close on dates, not minutes |

Function `maxDuration` is **not** a problem: Hobby allows the full 300 s, which
is what every long route here declares.

##### If daily ever feels too slow

It probably will not — OregonBuys posts few enough bids that a daily catch is
plenty, and `/admin` has a **Run scraper** button for when you want one now.

If you do want more, `supabase/scheduled_scrape.sql` adds extra sweeps using
`pg_cron` and `pg_net` on Supabase's free tier. Two extensions to enable, two
placeholders to fill, no new account. Leave the daily Vercel cron in place
alongside it — overlapping sweeps are harmless.

#### If Vercel refuses the deployment

Hobby projects only build commits from a GitHub account linked to the Vercel
account that owns the project. A *"they're not a member of the team"* email
means that link is missing. Three fixes, cheapest first:

1. Link the GitHub account in Vercel under
   *Account Settings → Authentication → GitHub*. Free, and the right fix.
2. Make the repository public. Vercel builds public repos on Hobby regardless
   of who pushed. Nothing in this repo is sensitive — `.env.local` is
   gitignored and `.env.example` holds only placeholders — but check before
   you flip it.
3. Upgrade to Pro and add the account as a collaborator. Costs money; the
   other two do not.

---

## Layout

```
src/
  config/
    company.ts     Alpha's identity, contractor profile, estimate defaults
    models.ts      every Claude model id, one place
    filters.ts     scraper keyword + NIGP prefilter
  prompts/         the Claude prompts, as editable .md — no code inside
  lib/
    supabase.ts    the one service-role client
    claude.ts      the one Anthropic wrapper: retries, schema validation, token log
    auth.ts        password-gate cookie signing
    money.ts       all estimate arithmetic
    oregonbuys/    fetching and parsing OregonBuys
  app/
    login/         password gate
    (app)/         everything behind the gate
    api/           route handlers
supabase/
  migrations/      schema
  seed/            placeholder unit prices
```

### The contractor profile is the most consequential file

`src/config/company.ts` holds `CONTRACTOR_PROFILE`, the text every fit score is
measured against. It is split three ways on purpose:

- **Self-performed** — Alpha's published services. These can score a straight
  `bid`.
- **Adjacent** — lead abatement, selective demolition, general hazmat, industrial
  hygiene. Plausible for a CCB-licensed environmental firm but *not advertised*,
  so the prompt routes them to `review` and a human decides.
- **Not a fit** — `no_bid` regardless of score.

Move a service between those three lists and every subsequent score changes.
That is the intended way to tune the tool.

### Things worth knowing

- **The model never does arithmetic.** Claude proposes line items and
  quantities; `src/lib/money.ts` computes every subtotal, markup, contingency
  and total.
- **Prompts are data.** `src/prompts/*.md` are read from disk at request time.
  Edit one, reload the page, and the next call uses it.
- **Nothing secret reaches the browser.** The service role key and the Anthropic
  key are read only inside route handlers and server components.
- **We are a polite scraper.** One page every 2 seconds, a descriptive user
  agent, and a file already in Storage is never downloaded twice.

---

## OregonBuys, as it actually behaves

Worth writing down, because it drove the design:

- The open-bids list at
  `/bso/view/search/external/advancedSearchBid.xhtml?openBids=true` renders
  **25 rows server-side on a plain GET**. No ViewState needed.
- Bid detail pages (`/bso/external/bidDetail.sda?docId=…&external=true`) are
  plain GETs and carry everything we need: bid number, title, agency, buyer name
  and email, close date, NIGP codes, location, pre-bid conference, attachments.
- Attachments download over a plain GET
  (`…&mode=download&downloadFileNbr=<n>`) with a correct
  `Content-Disposition` filename.
- **Pagination is the one blocked path.** The PrimeFaces paginator postback
  returns `403` from the WAF even with a live ViewState, session cookie and
  browser headers. So the cron scrape covers page 1 (the newest 25 open bids),
  which is comfortably more than OregonBuys posts in a day. Anything that slips
  past gets caught by **manual import by URL** on `/admin`.

If Alpha ever needs a full sweep of all open bids, the list fetcher sits behind
a small `ListStrategy` interface, so a Playwright-driven strategy can be dropped
in without touching the rest of the pipeline.

### The scrape_seen ledger

Only page one is readable, so most open bids are absent from any given run —
which means "it fell off the list" is *not* evidence a bid closed. Bids are
closed on their opening date instead.

And because the list row only carries a terse title, deciding whether a bid is
ours needs its detail page. Re-fetching all 25 on every run just to re-reject
the same ones is rude and slow, so `scrape_seen` keeps a bid-number ledger:
bid number, docId, and whether it matched. A bid we have already looked at and
rejected is not looked at again. Nothing else about it is stored.

---

## Handy scripts

No database or API keys needed for the first two:

```bash
npx tsx scripts/probe-bid.ts S-435000-00017903   # fetch + parse one bid, print everything
npx tsx scripts/probe-list.ts                    # page 1 of open bids, showing keyword hits
npx tsx scripts/run-scrape.ts                    # a full scrape run (needs Supabase)
```

`probe-bid.ts` is the fastest way to check a parser change against the live
site. It also takes `--file ./saved.html --doc-id S-1-2` to work offline.
