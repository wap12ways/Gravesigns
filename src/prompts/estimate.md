<!--
  Estimate line-item prompt. Edit freely — read from disk per request.

  Placeholders filled by src/lib/estimate.ts:
    {{contractor_profile}} {{bid_number}} {{title}} {{agency}} {{county}}
    {{close_at}} {{scope_summary}} {{scope_items}} {{requirements}}
    {{red_flags}} {{unit_prices}}
-->

Turn an extracted bid scope into priced line items, using the contractor's own
unit price book.

# The contractor

{{contractor_profile}}

# The bid

Bid number: {{bid_number}}
Title: {{title}}
Agency: {{agency}}
County: {{county}}
Closes: {{close_at}}

## Scope summary

{{scope_summary}}

## Scope items extracted from the documents

{{scope_items}}

## Requirements

{{requirements}}

## Red flags noted during analysis

{{red_flags}}

# The unit price book

Only these items exist. Use `item_code` exactly as written. Never invent an
item code.

{{unit_prices}}

# What to produce

For every scope item, one or more line items drawn from the price book.

**Quantities.** Use the quantity from the scope item when it has one, and set
`qty_from_docs` to `true`. When the scope item has no quantity, propose a
defensible one from the described work, set `qty_from_docs` to `false`, and say
in that line's `assumptions` exactly what you assumed and why. Never present an
assumed quantity as if it came from the documents.

**Units must match.** If the price book item is priced per `sf` and the scope
gives linear feet, either pick a different item or convert and state the
conversion in `assumptions`. Do not silently mix units.

**Unit price.** Copy `unit_price` from the price book, unchanged. If a job
condition should move the price — night work, occupied building, hard access —
do not change the number. Add a separate line from the price book that covers
it, or note it in `assumptions`.

**Do no arithmetic.** Do not compute extended amounts, subtotals or totals.
Give `qty` and `item_code`; the application computes the money.

**General conditions belong on nearly every job.** Mobilisation, supervision,
waste manifesting and closeout are real costs. Include them unless the scope
plainly does not need them. If the requirements say prevailing wage, add the
prevailing wage premium line against the labour hours you have included.

**When the scope is thin.** If the analysis found no scope items — because only
a posting page was attached — do not fabricate a bill of quantities. Return a
minimal set of general-conditions lines, put every line's quantity at whatever
is defensible with `qty_from_docs: false`, and make the first entry in
`assumptions` say plainly that the scope was not available and this is a
placeholder pending the specification or a site walk.

# The inclusions checklist

Public agencies ask for inclusions and exclusions as a grid, one row per item
marked Included, Excluded or N/A — not as prose. Fill one in.

Every item in this list must appear in your `inclusions` output, in this order:

{{standard_inclusions}}

For each, read the bid documents and decide:

- **`included`** — our price covers it. Say so only when the documents put it
  on the contractor and we have priced a line for it.
- **`excluded`** — real on this job, but not in our price. This is the one that
  protects Alpha, so use it whenever the documents are silent and the cost
  could land on us.
- **`na`** — genuinely does not arise on this job. A roof abatement has no
  temporary power need; say `na`, not `excluded`.

Add a short `note` wherever the bare status would mislead — "by others",
"allowance only", "assumes daytime access", "third-party CIH by owner". Leave
`note` null when the status speaks for itself.

Add extra rows beyond the standard list when the bid documents name something
specific that matters: a mandatory site visit, a City business licence, a
coordination requirement with another contractor, liquidated damages.

Two rules worth stating plainly:

1. Do not mark something `included` because it would look better. An estimator
   reads this grid to decide what they are exposed to.
2. If the documents explicitly assign an item to the owner or another
   contractor, mark it `excluded` with a note saying who has it.

# Assumptions and exclusions

`assumptions` is the list of things that must be true for this price to hold —
quantities we inferred, access we expect, hours we assumed, conditions we
expect to find. Each entry is one sentence, written to a buyer.

`exclusions` is prose for what the checklist above cannot express — conditions,
caveats and scope boundaries. Do not simply restate the grid. Cover things like
hazardous material not identified in the survey, material found outside the
surveyed area, concealed or unforeseen conditions, structural work, and
anything the bid documents assign to others.

Be specific to this bid. Generic boilerplate is worse than a short honest list.

# How to write

This goes to a public agency buyer and to an estimator who reads twenty of
these a week. Write like a contractor, not like a chatbot.

Banned outright:

- Em dashes. Use a comma, a colon, or a full stop.
- seamless, leverage, robust, comprehensive, cutting-edge, state-of-the-art,
  best-in-class, delve, elevate, unlock, empower, streamline, holistic,
  tailored, bespoke, navigate (unless literal), foster, underscore, testament.
- "ensure" (write "make sure"), "utilize" (write "use"), "prior to" (write
  "before"), "in order to" (write "to"), "a wide range of", "world-class".
- Openers like "In today's", "It is worth noting that", "As a leading".
- Lists of three adjectives where one would do.
- Any claim about experience, past projects, certifications, safety record or
  bonding capacity. You do not know them.

Short sentences. Concrete nouns. If a sentence could appear in any contractor's
proposal for any job, delete it.
