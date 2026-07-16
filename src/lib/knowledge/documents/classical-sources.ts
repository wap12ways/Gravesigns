/**
 * The legal-path source bibliography (kind `classical_source`).
 *
 * WHY THIS EXISTS
 * The delineation corpus is written originally; its doctrine is grounded in the
 * tradition. This document records WHICH primary works that tradition may be
 * drawn from AND STORED VERBATIM without a licence — i.e. works whose *text or
 * English translation* is in the public domain — together with the works whose
 * doctrine is fair to study but whose only modern translations are under
 * copyright and MUST NOT be ingested as text.
 *
 * It is provenance and an ingestion target-list, not interpretive content: the
 * composition pass never retrieves this kind (only `delineation`). When the
 * corpus later grows by ingesting full source text (for embedding-based
 * retrieval), this list is the legal boundary of what may be stored.
 *
 * RIGHTS NOTE (not legal advice)
 * Public-domain status is jurisdictional. The entries below are conservative:
 * "public domain" here means the work's English text was published before 1929
 * (US public domain) AND its translator died more than 70 years ago (clearing
 * most "life + 70" jurisdictions), or both. Anything failing either test is
 * marked DOCTRINE-ONLY — cite it as a study reference, never store its text.
 * Verify the specific edition's rights before ingesting.
 */
import type { KnowledgeDocument } from "../../types";

export const CLASSICAL_SOURCES_DOC: KnowledgeDocument = {
  slug: "gravesigns-classical-sources",
  kind: "classical_source",
  title: "GraveSigns — Legal-Path Source Bibliography",
  source: "Curated bibliography; rights status assessed per work (not legal advice).",
  attribution:
    "A working list of public-domain primary sources the practice may ingest, plus doctrine-only works whose modern translations remain under copyright. Confirm each edition's rights before storing its text.",
  version: "1",
  status: "active",
  content: `# Legal-path source bibliography

The practice's corpus is grown on the **legal path only**: original writing, plus
**public-domain** primary sources. No commercially licensed modern text is
ingested. This list is the boundary — what may be stored verbatim, and what may
only be studied.

## A. Public-domain — text may be ingested and stored

These works' English text was published before 1929 (US public domain) and, where
a translator is involved, the translator died more than 70 years ago.

- **Claudius Ptolemy, _Tetrabiblos_** — trans. J. M. Ashmand, 1822. The founding
  text of the tradition's method. Ashmand's translation is long out of copyright.
  Hosted at sacred-texts.com (\`/astro/ptb/\`) and the Internet Archive.
- **William Lilly, _Christian Astrology_** — London, 1647. The cornerstone of
  English traditional practice; the source of much of the 8th-house, dignity, and
  significator doctrine the delineations rest on. Public domain worldwide.
- **Marcus Manilius, _Astronomica_ (_Astronomicon_)** — early English verse
  translations (e.g. Thomas Creech, 1697; the 1675 _Sphere of Marcus Manilius_)
  are public domain. Avoid the 20th-century Loeb (Goold) translation, which is not.
- **Alan Leo** (William Frederick Allan, d. 1917) — _The Art of Synthesis_,
  _Esoteric Astrology_, _How to Judge a Nativity_, and the rest of his corpus.
  Author died more than 70 years ago; works are public domain. On the Internet
  Archive and Project Gutenberg.
- **Sepharial** (Walter Gorn Old, d. 1929) — his pre-1929 works are US public
  domain and clear "life + 70" as of 2000. Verify per title and jurisdiction.
- **Raphael / Zadkiel** (Robert Cross Smith, d. 1832; Richard Morrison, d. 1874)
  — the 19th-century English almanac-astrology works are public domain.

## B. Doctrine-only — study the ideas, do NOT ingest the text

The underlying works are ancient or medieval, but the only faithful modern English
translations are under copyright. Draw on their *doctrine* (as the delineation
corpus does, citing them as a study trail); never store a copyrighted translation.

- **Vettius Valens, _Anthologies_** — the Greek is ancient; Mark Riley's English
  translation is offered free by the translator but is **not public domain**.
  Treat as doctrine-only unless the translator's release terms are confirmed to
  permit storage.
- **Dorotheus of Sidon, _Carmen Astrologicum_** — Pingree (1976) and Dykes (2017)
  translations are under copyright. Doctrine-only.
- **Firmicus Maternus, _Matheseos libri VIII_** — Bram (1975) and Holden (2011)
  translations are under copyright. The Latin is public domain, but ingest a Latin
  edition only if that is genuinely useful. Doctrine-only for English.
- **Guido Bonatti, _Liber Astronomiae_**; **Abu Ma'shar**; **Māshā'allāh** — the
  medieval Latin/Arabic originals predate copyright, but the available English
  translations are modern and licensed. Doctrine-only.

## Ingestion policy (for the future text corpus)

When full source text is later stored for embedding-based retrieval:

1. Ingest **only Section A** works, from a specifically PD edition, recording the
   edition and its rights basis in the row's \`attribution\`.
2. Store each as \`knowledge_documents\` of kind \`classical_source\`, chunked by
   passage, with \`metadata\` tags mapping passages to the same factor keys the
   delineation retrieval uses (e.g. \`moon:Scorpio\`, \`house:8\`), so classical
   passages can be retrieved alongside the original delineations.
3. Keep Section B as **doctrine references only** — cite in a delineation's
   \`source\`, never copy the translated text.

_This is a rights-hygiene working note, not legal advice; confirm the status of
any specific edition before storing it._`,
  metadata: {
    policy: "public-domain-only",
    verified: false,
  },
};
