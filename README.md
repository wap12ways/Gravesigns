# Alpha Estimate

OregonBuys bid intelligence and estimating for **Alpha Environmental Services LLC**.

The app watches public solicitations on [OregonBuys](https://oregonbuys.gov/bso/),
scores them for fit against Alpha's trade profile, pulls the scope out of the bid
documents with Claude, and turns that scope into a priced estimate package ready
for review.

It is a private operator tool. One password, no user accounts.

---

## Stack

| Piece | Choice |
| --- | --- |
| App | Next.js 15 (App Router, TypeScript) on Vercel |
| Data | Supabase Postgres — service role key, server side only |
| Files | Supabase Storage, private `bid-documents` bucket |
| AI | Anthropic API. Model ids live in `src/config/models.ts` |
| Schedule | Vercel Cron, every 4 hours |
| Styling | Tailwind. No component library |

---

## Setup

### 1. Supabase

Create a project, then in **SQL Editor** run, in order:

1. `supabase/migrations/0001_init.sql` — tables, indexes, RLS lockdown, and the
   private `bid-documents` storage bucket.
2. `supabase/seed/unit_prices.sql` — 74 placeholder unit prices.

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
*Settings → Environment Variables*, deploy. `vercel.json` registers the
4-hourly cron against `/api/cron/scrape`; Vercel supplies the
`Authorization: Bearer $CRON_SECRET` header automatically.

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
  which every 4 hours is comfortably more than OregonBuys posts. Anything that
  slips past gets caught by **manual import by URL** on `/admin`.

If Alpha ever needs a full sweep of all open bids, the list fetcher sits behind
a small `ListStrategy` interface, so a Playwright-driven strategy can be dropped
in without touching the rest of the pipeline.

### The scrape_seen ledger

Only page one is readable, so most open bids are absent from any given run —
which means "it fell off the list" is *not* evidence a bid closed. Bids are
closed on their opening date instead.

And because the list row only carries a terse title, deciding whether a bid is
ours needs its detail page. Fetching all 25 every four hours just to re-reject
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
