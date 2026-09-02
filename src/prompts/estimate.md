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

# Assumptions and exclusions

`assumptions` is the list of things that must be true for this price to hold —
quantities we inferred, access we expect, hours we assumed, conditions we
expect to find. Each entry is one sentence, written to a buyer.

`exclusions` is what the price does not cover. Always consider: permits and
agency fees if not listed, third-party air monitoring and clearance testing,
abatement project design, hazardous material not identified in the survey,
structural work, restoration and replacement of removed materials, asbestos or
lead found outside the surveyed area, unforeseen conditions, work outside normal
hours, bonds, and anything the bid documents assign to others.

Be specific to this bid. Generic boilerplate is worse than a short honest list.
