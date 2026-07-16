/**
 * Natal delineation corpus — the interpretive layer for the NATIVITY (kind
 * `natal_delineation`).
 *
 * WHY THIS EXISTS
 * When birth details are supplied, the reading gains the Tier-2 natal sections
 * ("The Life That Was", "The Arc of Years", "The Return"). The death-chart
 * delineations are the wrong voice for those — their prose is framed around the
 * crossing ("the vessel that crossed"). These entries are natal-framed instead:
 * WHO THIS SOUL WAS by the promise of the birth sky. Retrieved from the natal
 * chart (not the death chart) and folded into composition only when a nativity
 * is present, so "The Life That Was" is built on real doctrine, not thin air.
 *
 * SHAPE & KEYS
 * Same `DelineationEntry` shape and factor-key scheme as the death corpus
 * (`moon:<sign>`, `sun:<sign>`, `asc:<sign>`), so the natal retrieval reuses the
 * same `activeFactorKeys` derivation — pointed at the natal chart. Every entry is
 * `applies: "natal"`.
 *
 * PROVENANCE & RIGHTS
 * Written originally for GraveSigns; doctrine grounded in the public-domain
 * tradition (Ptolemy on the luminaries and the horoscopos; the classical
 * sign/temperament lore). No copyrighted modern text reproduced.
 *
 * INTEGRITY
 * These read a birth chart as CHARACTER, never as a prediction of the life or
 * its end. Descriptive of who the person was, laid tenderly beside a life
 * already complete.
 */
import type { DelineationEntry, KnowledgeDocument } from "../../types";

export const NATAL_DELINEATIONS: DelineationEntry[] = [
  // ── The Sun by sign — the core identity, purpose, and vital spirit. ─────────
  {
    key: "sun:Aries",
    family: "sun",
    title: "Natal Sun in Aries",
    body: "By the promise of the birth sky, this was a soul of beginnings and courage — the Sun exalted in Aries lights a life meant to go first, to initiate, to meet the world head-on. There was a directness and a bravery near the center of who they were.",
    source: "Ptolemy, Tetrabiblos (the Sun; exaltation in Aries)",
    applies: "natal",
  },
  {
    key: "sun:Taurus",
    family: "sun",
    title: "Natal Sun in Taurus",
    body: "The birth Sun in Taurus gave a steady, enduring core — a soul rooted in the tangible, patient, and loyal to what it loved. There was a quiet strength here, a life built to last and to hold.",
    source: "Firmicus Maternus, Mathesis; traditional solar doctrine",
    applies: "natal",
  },
  {
    key: "sun:Gemini",
    family: "sun",
    title: "Natal Sun in Gemini",
    body: "The birth Sun in Gemini gave a quick, curious, many-sided spirit — a soul that lived through connection, words, and the play of ideas. There was a brightness and a versatility at the heart of who they were.",
    source: "Traditional solar doctrine (the double-bodied signs)",
    applies: "natal",
  },
  {
    key: "sun:Cancer",
    family: "sun",
    title: "Natal Sun in Cancer",
    body: "The birth Sun in Cancer gave a tender, protective core — a soul whose identity was bound up with home, memory, and the care of others. There was a deep feeling and a sheltering warmth near the center of who they were.",
    source: "Traditional solar doctrine (the Sun in the Moon's sign)",
    applies: "natal",
  },
  {
    key: "sun:Leo",
    family: "sun",
    title: "Natal Sun in Leo",
    body: "The Sun ruled its own sign at this birth — a radiant, generous, whole-hearted soul, meant to shine and to give warmth. There was a natural dignity and a largeness of heart at the very center of who they were.",
    source: "Ptolemy, Tetrabiblos (the Sun's domicile in Leo)",
    applies: "natal",
  },
  {
    key: "sun:Virgo",
    family: "sun",
    title: "Natal Sun in Virgo",
    body: "The birth Sun in Virgo gave a careful, discerning core — a soul that found meaning in service, craft, and the quiet perfecting of things. There was a modesty and a usefulness at the heart of who they were.",
    source: "Firmicus Maternus, Mathesis; traditional solar doctrine",
    applies: "natal",
  },
  {
    key: "sun:Libra",
    family: "sun",
    title: "Natal Sun in Libra",
    body: "The birth Sun in Libra gave a core turned toward others — a soul of fairness, grace, and the seeking of balance and beauty. Their identity was woven through relationship, and there was a gentleness and a longing for harmony at the center of who they were.",
    source: "Traditional solar doctrine (the Sun in Venus's cardinal air)",
    applies: "natal",
  },
  {
    key: "sun:Scorpio",
    family: "sun",
    title: "Natal Sun in Scorpio",
    body: "The birth Sun in Scorpio gave a deep, intense core — a soul acquainted with the hidden, unafraid of the profound, loyal to the very bone. There was a searching depth and a quiet power at the heart of who they were.",
    source: "Traditional solar doctrine (the Sun in the martial water)",
    applies: "natal",
  },
  {
    key: "sun:Sagittarius",
    family: "sun",
    title: "Natal Sun in Sagittarius",
    body: "The birth Sun in Sagittarius gave a wide, questing core — a soul aimed at meaning, freedom, and the far horizon. There was an optimism and a largeness of vision at the center of who they were.",
    source: "Traditional solar doctrine (the Sun in Jupiter's fire)",
    applies: "natal",
  },
  {
    key: "sun:Capricorn",
    family: "sun",
    title: "Natal Sun in Capricorn",
    body: "The birth Sun in Capricorn gave a grave, enduring core — a soul of purpose, discipline, and the long climb. There was a quiet resolve and a sense of responsibility at the heart of who they were.",
    source: "Traditional solar doctrine (the Sun in Saturn's sign)",
    applies: "natal",
  },
  {
    key: "sun:Aquarius",
    family: "sun",
    title: "Natal Sun in Aquarius",
    body: "The birth Sun in Aquarius gave a clear, independent core — a soul that belonged to something larger than itself, humane and original. There was a cool brightness and a loyalty to the whole at the center of who they were.",
    source: "Traditional solar doctrine (the Sun in Saturn's airy sign)",
    applies: "natal",
  },
  {
    key: "sun:Pisces",
    family: "sun",
    title: "Natal Sun in Pisces",
    body: "The birth Sun in Pisces gave a gentle, porous core — a soul of compassion, imagination, and easy mercy, half-merged with the feeling of the world. There was a tenderness and a longing for the transcendent at the heart of who they were.",
    source: "Traditional solar doctrine (the Sun in Jupiter's water)",
    applies: "natal",
  },

  // ── The Moon by sign — the emotional nature, instinct, and inner needs. ──────
  {
    key: "moon:Aries",
    family: "moon",
    title: "Natal Moon in Aries",
    body: "The birth Moon in Aries gave a heart that felt quickly and bravely — needing honesty and freedom more than comfort, quick to warm and quick to forgive. Their instincts were direct, their feeling immediate and unhidden.",
    source: "Ptolemy, Tetrabiblos (the Moon in cardinal fire)",
    applies: "natal",
  },
  {
    key: "moon:Taurus",
    family: "moon",
    title: "Natal Moon in Taurus",
    body: "The Moon was exalted at this birth — a heart steady and calm, needing security, tenderness, and the comfort of the tangible. Their feeling nature was loyal and slow to change, a deep well of quiet constancy.",
    source: "Ptolemy, Tetrabiblos (the Moon's exaltation in Taurus)",
    applies: "natal",
  },
  {
    key: "moon:Gemini",
    family: "moon",
    title: "Natal Moon in Gemini",
    body: "The birth Moon in Gemini gave a lively, curious heart — needing conversation, variety, and the meeting of minds. Their feelings moved quickly and found their footing in words and in the company of others.",
    source: "Traditional lunar doctrine (the Moon in mutable air)",
    applies: "natal",
  },
  {
    key: "moon:Cancer",
    family: "moon",
    title: "Natal Moon in Cancer",
    body: "The Moon ruled its own sign at this birth — a deeply feeling, nurturing heart, needing home, belonging, and the care of those it loved. Their emotional nature was tidal and tender, a native at home in its own depths.",
    source: "Ptolemy, Tetrabiblos (the Moon's domicile in Cancer)",
    applies: "natal",
  },
  {
    key: "moon:Leo",
    family: "moon",
    title: "Natal Moon in Leo",
    body: "The birth Moon in Leo gave a warm, generous heart — needing to love and be loved openly, to give warmth and to be seen. Their feeling nature was proud and loyal, radiant in its affections.",
    source: "Traditional lunar doctrine (the Moon in the Sun's sign)",
    applies: "natal",
  },
  {
    key: "moon:Virgo",
    family: "moon",
    title: "Natal Moon in Virgo",
    body: "The birth Moon in Virgo gave a careful, devoted heart — needing to be useful, to tend and to mend, expressing love through service and quiet attention. Their feeling nature was modest and precise, steady in its care.",
    source: "Traditional lunar doctrine (the Moon in Mercury's earth)",
    applies: "natal",
  },
  {
    key: "moon:Libra",
    family: "moon",
    title: "Natal Moon in Libra",
    body: "The birth Moon in Libra gave a heart attuned to others — needing harmony, companionship, and fairness, uneasy with discord. Their feeling nature was gracious and relational, most at peace in balance.",
    source: "Traditional lunar doctrine (the Moon in Venus's cardinal air)",
    applies: "natal",
  },
  {
    key: "moon:Scorpio",
    family: "moon",
    title: "Natal Moon in Scorpio",
    body: "The Moon was in her fall at this birth, yet it gave a heart of great depth — feeling intensely and privately, loyal to the point of the profound, unafraid of the hidden currents of the soul. Their emotional nature ran deep and true, whatever the tradition names it.",
    source: "Ptolemy, Tetrabiblos (the Moon's fall in Scorpio)",
    applies: "natal",
  },
  {
    key: "moon:Sagittarius",
    family: "moon",
    title: "Natal Moon in Sagittarius",
    body: "The birth Moon in Sagittarius gave a free, hopeful heart — needing room to roam, meaning to believe in, and honesty above comfort. Their feeling nature was warm and open, restless for the horizon.",
    source: "Traditional lunar doctrine (the Moon in Jupiter's fire)",
    applies: "natal",
  },
  {
    key: "moon:Capricorn",
    family: "moon",
    title: "Natal Moon in Capricorn",
    body: "The Moon was in detriment at this birth, yet it gave a heart of quiet endurance — needing to be relied upon, careful with its feeling, steadfast under weight. Their emotional nature was reserved and deeply loyal, love shown through constancy rather than display.",
    source: "Traditional lunar doctrine (the Moon in Saturn's sign)",
    applies: "natal",
  },
  {
    key: "moon:Aquarius",
    family: "moon",
    title: "Natal Moon in Aquarius",
    body: "The birth Moon in Aquarius gave a wide, humane heart — needing freedom and friendship more than possession, feeling for the whole as much as the near. Their emotional nature was cool, kind, and independent.",
    source: "Traditional lunar doctrine (the Moon in Saturn's airy sign)",
    applies: "natal",
  },
  {
    key: "moon:Pisces",
    family: "moon",
    title: "Natal Moon in Pisces",
    body: "The birth Moon in Pisces gave a porous, compassionate heart — needing beauty, mercy, and the dissolving of boundaries, feeling the world's sorrow and wonder as its own. Their emotional nature was gentle and boundless, quick to forgive.",
    source: "Traditional lunar doctrine (the Moon in Jupiter's water)",
    applies: "natal",
  },

  // ── The Ascendant by sign — the self presented, the approach to living. ─────
  {
    key: "asc:Aries",
    family: "asc",
    title: "Natal Aries rising",
    body: "Aries rising set a direct, courageous face on the world — this soul met life head-on, quick to act and unafraid to be first. There was an energy and a frankness in how they came at things.",
    source: "Ptolemy, Tetrabiblos III (the horoscopos)",
    applies: "natal",
  },
  {
    key: "asc:Taurus",
    family: "asc",
    title: "Natal Taurus rising",
    body: "Taurus rising set a calm, grounded face on the world — this soul approached life steadily, with patience and a love of the real. There was a settledness and a gentle stubbornness in how they moved through things.",
    source: "Ptolemy, Tetrabiblos III (the horoscopos)",
    applies: "natal",
  },
  {
    key: "asc:Gemini",
    family: "asc",
    title: "Natal Gemini rising",
    body: "Gemini rising set a quick, communicative face on the world — this soul approached life with curiosity and wit, at home in words and in exchange. There was a lightness and an adaptability in how they engaged.",
    source: "Ptolemy, Tetrabiblos III (the horoscopos)",
    applies: "natal",
  },
  {
    key: "asc:Cancer",
    family: "asc",
    title: "Natal Cancer rising",
    body: "Cancer rising set a tender, careful face on the world — this soul approached life protectively, feeling its way, sheltering itself and others. There was a sensitivity and a warmth in how they met things.",
    source: "Ptolemy, Tetrabiblos III (the horoscopos)",
    applies: "natal",
  },
  {
    key: "asc:Leo",
    family: "asc",
    title: "Natal Leo rising",
    body: "Leo rising set a warm, radiant face on the world — this soul approached life generously, with heart and a certain natural presence. There was a dignity and an openness in how they carried themselves.",
    source: "Ptolemy, Tetrabiblos III (the horoscopos)",
    applies: "natal",
  },
  {
    key: "asc:Virgo",
    family: "asc",
    title: "Natal Virgo rising",
    body: "Virgo rising set a modest, observant face on the world — this soul approached life carefully, wanting to understand and to be of use. There was a quietness and a conscientiousness in how they engaged.",
    source: "Ptolemy, Tetrabiblos III (the horoscopos)",
    applies: "natal",
  },
  {
    key: "asc:Libra",
    family: "asc",
    title: "Natal Libra rising",
    body: "Libra rising set a gracious, considerate face on the world — this soul approached life through relationship, seeking harmony and meeting others halfway. There was a charm and a fairness in how they carried themselves.",
    source: "Ptolemy, Tetrabiblos III (the horoscopos)",
    applies: "natal",
  },
  {
    key: "asc:Scorpio",
    family: "asc",
    title: "Natal Scorpio rising",
    body: "Scorpio rising set a deep, watchful face on the world — this soul approached life intensely and privately, guarding much and feeling everything. There was a magnetism and a reserve in how they met things.",
    source: "Ptolemy, Tetrabiblos III (the horoscopos)",
    applies: "natal",
  },
  {
    key: "asc:Sagittarius",
    family: "asc",
    title: "Natal Sagittarius rising",
    body: "Sagittarius rising set an open, hopeful face on the world — this soul approached life with candor and appetite, always aimed a little past the horizon. There was a warmth and a restlessness in how they engaged.",
    source: "Ptolemy, Tetrabiblos III (the horoscopos)",
    applies: "natal",
  },
  {
    key: "asc:Capricorn",
    family: "asc",
    title: "Natal Capricorn rising",
    body: "Capricorn rising set a composed, capable face on the world — this soul approached life seriously and steadily, carrying responsibility with quiet resolve. There was a gravity and a dependability in how they carried themselves.",
    source: "Ptolemy, Tetrabiblos III (the horoscopos)",
    applies: "natal",
  },
  {
    key: "asc:Aquarius",
    family: "asc",
    title: "Natal Aquarius rising",
    body: "Aquarius rising set a cool, original face on the world — this soul approached life on its own terms, humane and a little apart, loyal to its principles. There was an independence and a friendliness in how they engaged.",
    source: "Ptolemy, Tetrabiblos III (the horoscopos)",
    applies: "natal",
  },
  {
    key: "asc:Pisces",
    family: "asc",
    title: "Natal Pisces rising",
    body: "Pisces rising set a soft, receptive face on the world — this soul approached life gently and impressionably, porous to beauty and to sorrow alike. There was a kindness and a dreaminess in how they met things.",
    source: "Ptolemy, Tetrabiblos III (the horoscopos)",
    applies: "natal",
  },
];

/**
 * The bundled natal delineation corpus, wrapped as a KnowledgeDocument of kind
 * `natal_delineation`. Loaded through the one knowledge seam like every other
 * document (Supabase override, bundled fallback); entries ride in
 * `metadata.entries` exactly like the death corpus.
 */
export const NATAL_DELINEATIONS_DOC: KnowledgeDocument = {
  slug: "gravesigns-natal-delineations",
  kind: "natal_delineation",
  title: "GraveSigns — Natal Delineation Corpus (the life that was)",
  source:
    "Original compilation; doctrine drawn from the public-domain tradition (Ptolemy on the luminaries and the horoscopos).",
  attribution:
    "Written originally for GraveSigns. Cited sources are public-domain works, referenced as a study trail — no copyrighted text is reproduced.",
  version: "1",
  status: "active",
  content:
    "The practice's natal-framed delineation reference — the Sun, Moon, and Ascendant by sign, read as the character of the nativity ('who this soul was'). Retrieved from the natal chart and folded into the Tier-2 sections when birth details are supplied.",
  metadata: {
    entries: NATAL_DELINEATIONS,
    entry_count: NATAL_DELINEATIONS.length,
  },
};
