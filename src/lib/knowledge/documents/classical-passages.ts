/**
 * Public-domain primary-source passages (kind `classical_source`).
 *
 * The tradition in its own words. Where the delineation corpus is written
 * originally (grounded in the tradition), these are VERBATIM excerpts from a
 * public-domain edition, retrieved by the same factor keys and folded into the
 * composition pass as a secondary reference so the reading can carry a genuine
 * classical grain.
 *
 * SOURCE & RIGHTS
 * All excerpts below are from Claudius Ptolemy's _Tetrabiblos_ in the English
 * translation of J. M. Ashmand (London, 1822) — long out of copyright and in the
 * public domain worldwide. Digitized text was sourced from a public-domain
 * edition; typography (curly quotes) has been normalized to ASCII, but no word
 * is altered. This is a Section-A work in the legal-path bibliography
 * (`classical-sources.ts`).
 *
 * EDITORIAL POLICY — integrity first
 * Only passages on the NATURE and TEMPERAMENT of the bodies are ingested. The
 * _Tetrabiblos_' chapters on the duration and the kind of death (Books III–IV,
 * which assign specific diseases and manners of death to the planets) are
 * DELIBERATELY EXCLUDED: GraveSigns never reads for a cause or a manner of
 * death, and the composer must never be handed material that pushes toward one.
 */
import type { ClassicalPassage, KnowledgeDocument } from "../../types";

export const CLASSICAL_PASSAGES: ClassicalPassage[] = [
  {
    key: "significator:Saturn",
    work: "Ptolemy, Tetrabiblos",
    ref: "Book I, ch. 4 (Ashmand trans., 1822; public domain)",
    text: "Saturn produces cold and dryness, for he is most remote both from the Sun's heat and from the earth's vapours. But he is more effective in the production of cold than of dryness.",
  },
  {
    key: "significator:Mars",
    work: "Ptolemy, Tetrabiblos",
    ref: "Book I, ch. 4 (Ashmand trans., 1822; public domain)",
    text: "Mars chiefly causes dryness, and is also strongly heating, by means of his own fiery nature, which is indicated by his colour.",
  },
  {
    key: "aspect:Jupiter-soft",
    work: "Ptolemy, Tetrabiblos",
    ref: "Book I, ch. 4 (Ashmand trans., 1822; public domain)",
    text: "Jupiter revolves in an intermediate sphere between the extreme cold of Saturn and the burning heat of Mars, and has consequently a temperate influence: he therefore at once promotes both warmth and moisture.",
  },
  {
    key: "aspect:Venus-soft",
    work: "Ptolemy, Tetrabiblos",
    ref: "Book I, ch. 4 (Ashmand trans., 1822; public domain)",
    text: "To Venus also the same temperate quality belongs, although it exists conversely; since the heat she produces by her vicinity to the Sun is not so great as the moisture which she generates by the magnitude of her light.",
  },
  {
    key: "aspect:Saturn-hard",
    work: "Ptolemy, Tetrabiblos",
    ref: "Book I, ch. 5 (Ashmand trans., 1822; public domain)",
    text: "Two of the planets, on account of their temperate quality, and because heat and moisture are predominant in them, are considered by the ancients as benefic, or causers of good: these are Jupiter and Venus. And the Moon also is so considered for the same reasons. But Saturn and Mars are esteemed of a contrary nature, and malefic.",
  },
  {
    key: "sect:night",
    work: "Ptolemy, Tetrabiblos",
    ref: "Book I, ch. 7 (Ashmand trans., 1822; public domain)",
    text: "The day, in its heat and its aptitude for action, is masculine: the night, in its moisture and its appropriation to rest, feminine. Hence, again, the Moon and Venus are esteemed to be nocturnal; the Sun and Jupiter, diurnal; and Mercury, common.",
  },
  {
    key: "sect:day",
    work: "Ptolemy, Tetrabiblos",
    ref: "Book I, ch. 7 (Ashmand trans., 1822; public domain)",
    text: "The day, in its heat and its aptitude for action, is masculine: the night, in its moisture and its appropriation to rest, feminine. Hence, again, the Moon and Venus are esteemed to be nocturnal; the Sun and Jupiter, diurnal; and Mercury, common.",
  },
];

/**
 * The bundled classical-passage set, wrapped as a KnowledgeDocument of kind
 * `classical_source`. The passages ride in `metadata.passages` (distinct from a
 * delineation doc's `metadata.entries`), so the passage retrieval can tell the
 * two apart while both load through the one knowledge seam. A production DB row
 * of kind `classical_source` with `metadata.passages` drops in with no code
 * change.
 */
export const CLASSICAL_PASSAGES_DOC: KnowledgeDocument = {
  slug: "ptolemy-tetrabiblos-passages",
  kind: "classical_source",
  title: "Ptolemy, Tetrabiblos — public-domain passages (Ashmand 1822)",
  source:
    "Claudius Ptolemy, Tetrabiblos, trans. J. M. Ashmand (London, 1822). Public domain; digitized from a public-domain edition.",
  attribution:
    "Public domain (translator J. M. Ashmand, 1822). Verbatim excerpts; typography normalized, wording unaltered. Nature/temperament passages only — duration- and kind-of-death chapters deliberately excluded.",
  version: "1",
  status: "active",
  content:
    "Verbatim public-domain excerpts from Ptolemy's Tetrabiblos (Ashmand 1822) on the temperament and nature of the bodies, retrieved by factor key and folded into composition as a secondary classical reference. Cause- and manner-of-death chapters are excluded by policy.",
  metadata: {
    passages: CLASSICAL_PASSAGES,
    passage_count: CLASSICAL_PASSAGES.length,
    rights: "public-domain",
  },
};
