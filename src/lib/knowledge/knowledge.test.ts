/**
 * Tests for the knowledge corpus + delineation retrieval seam.
 *
 * These exercise the deterministic engine end-to-end without any network or
 * model call: the corpus is bundled, and retrieval keys off the same computed
 * frame the visuals use. This is how the reading-depth work is verified when the
 * live pipeline (which needs an ANTHROPIC_API_KEY) can't be run.
 */
import { describe, it, expect } from "vitest";
import type { DeathChart, DelineationEntry } from "../types";
import type { ChartAnalysis } from "../analysis";
import {
  BUNDLED_DOCUMENTS,
  activeFactorKeys,
  selectDelineations,
  delineationBrief,
  delineationEntries,
  getDelineations,
  selectClassicalPassages,
  classicalBrief,
  classicalPassages,
  getClassicalSources,
} from "./index";
import { DEATH_DELINEATIONS } from "./documents/death-delineations";
import { CLASSICAL_PASSAGES } from "./documents/classical-passages";

// The families the retrieval can emit and the corpus is expected to cover.
const COVERED_FAMILIES: DelineationEntry["family"][] = [
  "moon", "sun", "phase", "sect", "element", "modality", "shape",
  "significator", "ruler", "dignity", "aspect", "pattern", "house", "lot", "star",
];

// Every entry's key prefix must map to its declared family.
const PREFIX_FAMILY: Record<string, DelineationEntry["family"]> = {
  moon: "moon", sun: "sun", phase: "phase", sect: "sect", element: "element",
  modality: "modality", shape: "shape", significator: "significator",
  ruler: "ruler", dignity: "dignity", aspect: "aspect", pattern: "pattern",
  house: "house", lot: "lot", star: "star",
};

// Spine-first priority the selection ranks by. The sequence of families in any
// result must be a subsequence of this order.
const FAMILY_PRIORITY: DelineationEntry["family"][] = [
  "moon", "phase", "ruler", "significator", "dignity", "aspect", "pattern",
  "house", "lot", "star", "shape", "sun", "element", "modality", "sect",
];

/** A richly-populated synthetic chart that lights up most factor families. */
function makeChart(over: Partial<DeathChart> = {}): DeathChart {
  return {
    timestampUtc: "2020-11-30T12:00:00Z",
    timeKnown: true,
    locationKnown: true,
    latitude: 40,
    longitude: -74,
    ascendant: { sign: "Cancer", degreeInSign: 10 },
    midheaven: { sign: "Pisces", degreeInSign: 5 },
    ascendantLon: 100,
    midheavenLon: 335,
    houseCusps: Array.from({ length: 13 }, (_, i) => i * 30),
    sect: "night",
    planets: [
      { name: "Moon", longitude: 220, sign: "Scorpio", degreeInSign: 10, house: 5, retrograde: false, speed: 12 },
      { name: "Sun", longitude: 40, sign: "Taurus", degreeInSign: 10, house: 11, retrograde: false, speed: 1 },
      { name: "Jupiter", longitude: 100, sign: "Cancer", degreeInSign: 10, house: 1, retrograde: false, speed: 0.1 },
      { name: "Venus", longitude: 160, sign: "Virgo", degreeInSign: 10, house: 3, retrograde: false, speed: 1 },
      { name: "Saturn", longitude: 300, sign: "Aquarius", degreeInSign: 0, house: 8, retrograde: false, speed: 0.05 },
      { name: "Mars", longitude: 10, sign: "Aries", degreeInSign: 10, house: 10, retrograde: false, speed: 0.5 },
      { name: "Pluto", longitude: 295, sign: "Capricorn", degreeInSign: 25, house: 7, retrograde: false, speed: 0.01 },
      { name: "Mean Node", longitude: 80, sign: "Gemini", degreeInSign: 20, house: 12, retrograde: true, speed: -0.05 },
    ],
    aspects: [
      { a: "Jupiter", b: "Moon", type: "Trine", orb: 2 },
      { a: "Venus", b: "Sun", type: "Sextile", orb: 1 },
    ],
    dominantElement: "Water",
    dominantModality: "Fixed",
    moonPhase: "Full Moon",
    ephemeris: "Swiss",
    timezone: "America/New_York",
    ...over,
  } as unknown as DeathChart;
}

function makeAnalysis(over: Partial<ChartAnalysis> = {}): ChartAnalysis {
  return {
    version: 1,
    sect: "night",
    ascendantAlmuten: { planet: "Moon", score: 5 },
    lots: [
      { name: "Part of Fortune", sign: "Leo", degreeInSign: 5, house: 2, ruler: "Sun", formula: "", source: "Paulus" },
      { name: "Lot of Death (Ascendant form)", sign: "Aries", degreeInSign: 12, house: 10, ruler: "Mars", formula: "", source: "Paulus" },
    ],
    patterns: [
      { type: "Grand Trine", members: ["Moon", "Jupiter", "Venus"], description: "" },
      { type: "T-Square", members: ["Sun", "Saturn", "Mars"], description: "" },
    ],
    shape: { shape: "Bowl", description: "" },
    fixedStars: [
      { star: "Algol", body: "Mars", orb: 1.2, magnitude: 2.1, royal: false, keywords: "severance" },
      { star: "Spica", body: "Moon", orb: 0.8, magnitude: 1.0, royal: false, keywords: "grace" },
    ],
    dignities: [
      { planet: "Moon", sign: "Scorpio", essential: { domicile: false, exaltation: false, detriment: false, fall: true, peregrine: false }, total: -4 },
      { planet: "Saturn", sign: "Aquarius", essential: { domicile: true, exaltation: false, detriment: false, fall: false, peregrine: false }, total: 5 },
    ],
    death: {
      houses: [
        { house: 8, role: "death" },
        { house: 4, role: "grave" },
        { house: 12, role: "undoing" },
      ],
      mortalSignificators: [
        { name: "Saturn" }, { name: "Mars" }, { name: "Moon" }, { name: "Sun" }, { name: "Pluto" },
      ],
      anaretic: [],
      maleficContacts: [
        { malefic: "Saturn", body: "Sun", aspect: "Opposition", orb: 1 },
        { malefic: "Mars", body: "Moon", aspect: "Square", orb: 2 },
      ],
      angularityUnknown: false,
    },
    balance: { elements: {}, modalities: {} },
    ...over,
  } as unknown as ChartAnalysis;
}

describe("delineation corpus integrity", () => {
  it("is non-empty and every entry is well-formed", () => {
    expect(DEATH_DELINEATIONS.length).toBeGreaterThan(50);
    for (const e of DEATH_DELINEATIONS) {
      expect(e.key, `key on ${JSON.stringify(e.title)}`).toMatch(/^[a-z]+:.+/);
      expect(e.title.trim().length, e.key).toBeGreaterThan(0);
      expect(e.body.trim().length, e.key).toBeGreaterThan(40);
      expect(COVERED_FAMILIES, e.key).toContain(e.family);
      if (e.applies) expect(["moment", "natal", "both"]).toContain(e.applies);
    }
  });

  it("has no duplicate keys", () => {
    const keys = DEATH_DELINEATIONS.map((e) => e.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("declares a family consistent with each key's prefix", () => {
    for (const e of DEATH_DELINEATIONS) {
      const prefix = e.key.split(":")[0];
      expect(PREFIX_FAMILY[prefix], `unknown prefix in ${e.key}`).toBeDefined();
      expect(e.family, `family/prefix mismatch on ${e.key}`).toBe(PREFIX_FAMILY[prefix]);
    }
  });

  it("has no stray non-Latin homoglyphs in the prose", () => {
    const homoglyph = /[Ͱ-ϿЀ-ӿ]/;
    for (const e of DEATH_DELINEATIONS) {
      expect(homoglyph.test(e.body), `homoglyph in ${e.key}`).toBe(false);
      expect(homoglyph.test(e.title), `homoglyph in ${e.key} title`).toBe(false);
    }
  });

  it("covers every family the retrieval can emit", () => {
    const present = new Set(DEATH_DELINEATIONS.map((e) => e.family));
    for (const fam of COVERED_FAMILIES) {
      expect(present.has(fam), `no corpus entry for family "${fam}"`).toBe(true);
    }
  });
});

describe("activeFactorKeys", () => {
  it("derives the expected keys from a rich chart", () => {
    const keys = activeFactorKeys(makeChart(), makeAnalysis());
    for (const k of [
      "moon:Scorpio", "sun:Taurus", "phase:Full Moon", "sect:night",
      "element:Water", "modality:Fixed", "shape:Bowl", "ruler:Moon",
      "significator:Saturn", "significator:Moon", "significator:Nodes",
      "dignity:fall", "dignity:domicile",
      "aspect:Saturn-hard", "aspect:Mars-hard", "aspect:Jupiter-soft", "aspect:Venus-soft",
      "pattern:Grand Trine", "pattern:T-Square",
      "house:8", "house:4", "house:12",
      "lot:Part of Fortune", "lot:Lot of Death",
      "star:Algol", "star:Spica",
    ]) {
      expect(keys.has(k), `missing active key ${k}`).toBe(true);
    }
  });

  it("emits no dignity/aspect keys for a bare chart with no such testimony", () => {
    const bare = makeAnalysis({
      dignities: [],
      ascendantAlmuten: null,
      patterns: [],
      fixedStars: [],
      death: {
        houses: [{ house: 8, role: "" }, { house: 4, role: "" }, { house: 12, role: "" }],
        mortalSignificators: [{ name: "Moon" }],
        anaretic: [],
        maleficContacts: [],
        angularityUnknown: true,
      },
    } as unknown as Partial<ChartAnalysis>);
    const keys = activeFactorKeys(makeChart({ aspects: [] }), bare);
    expect([...keys].some((k) => k.startsWith("dignity:"))).toBe(false);
    expect([...keys].some((k) => k.startsWith("aspect:"))).toBe(false);
    expect([...keys].some((k) => k.startsWith("ruler:"))).toBe(false);
    expect([...keys].some((k) => k.startsWith("pattern:"))).toBe(false);
  });
});

describe("selectDelineations", () => {
  it("returns only entries whose key is active, with no duplicates", async () => {
    const chart = makeChart();
    const analysis = makeAnalysis();
    const active = activeFactorKeys(chart, analysis);
    const sel = await selectDelineations(chart, analysis);

    expect(sel.length).toBeGreaterThan(10);
    const keys = sel.map((e) => e.key);
    expect(new Set(keys).size, "duplicate keys in selection").toBe(keys.length);
    for (const e of sel) expect(active.has(e.key), `inactive key ${e.key}`).toBe(true);
  });

  it("ranks spine-first (family sequence is a subsequence of the priority order)", async () => {
    const sel = await selectDelineations(makeChart(), makeAnalysis());
    const rank = (f: DelineationEntry["family"]) => FAMILY_PRIORITY.indexOf(f);
    for (let i = 1; i < sel.length; i++) {
      expect(rank(sel[i].family)).toBeGreaterThanOrEqual(rank(sel[i - 1].family));
    }
  });

  it("respects the limit and keeps the highest-priority families", async () => {
    const sel = await selectDelineations(makeChart(), makeAnalysis(), { limit: 3 });
    expect(sel.length).toBe(3);
    // The spine leads: Moon, then phase, then the ruling hand.
    expect(sel.map((e) => e.family)).toEqual(["moon", "phase", "ruler"]);
  });
});

describe("delineationBrief", () => {
  it("is empty for no entries", () => {
    expect(delineationBrief([])).toBe("");
  });

  it("renders family headings and every selected title", async () => {
    const sel = await selectDelineations(makeChart(), makeAnalysis());
    const brief = delineationBrief(sel);
    expect(brief).toContain("### The Soul's Vehicle — the Moon");
    expect(brief).toContain("### The Ruling Hand");
    for (const e of sel) expect(brief, `missing title ${e.title}`).toContain(e.title);
  });
});

describe("bundled corpus wiring", () => {
  it("bundles the ethics, delineation, and classical-source kinds", () => {
    const kinds = new Set(BUNDLED_DOCUMENTS.map((d) => d.kind));
    expect(kinds.has("code_of_ethics")).toBe(true);
    expect(kinds.has("delineation")).toBe(true);
    expect(kinds.has("classical_source")).toBe(true);
  });

  it("loads delineation entries through the knowledge seam (bundled fallback)", async () => {
    const entries = delineationEntries(await getDelineations());
    expect(entries.length).toBe(DEATH_DELINEATIONS.length);
  });
});

describe("classical passages (public-domain primary sources)", () => {
  it("every passage is well-formed and carries a work + citation", () => {
    expect(CLASSICAL_PASSAGES.length).toBeGreaterThan(0);
    for (const p of CLASSICAL_PASSAGES) {
      expect(p.key).toMatch(/^[a-z]+:.+/);
      expect(p.text.trim().length, p.key).toBeGreaterThan(30);
      expect(p.work.trim().length, p.key).toBeGreaterThan(0);
      expect(p.ref.trim().length, p.key).toBeGreaterThan(0);
    }
  });

  it("carries no cause-/manner-of-death content (integrity policy)", () => {
    // Temperament passages only: the duration/kind-of-death chapters are excluded
    // by policy, so no ingested passage may name a disease or manner of death.
    const forbidden = /\b(disease|death|dies|die|dying|killed?|fever|wound|apoplexy|dropsy|quinsey|hæmorrhage|hemorrhage|abortion|childbirth|lingering)\b/i;
    for (const p of CLASSICAL_PASSAGES) {
      expect(forbidden.test(p.text), `forbidden death-content in passage ${p.key}: "${p.text}"`).toBe(false);
    }
  });

  it("loads through the knowledge seam and every passage key is a real factor key", async () => {
    const passages = classicalPassages(await getClassicalSources());
    expect(passages.length).toBe(CLASSICAL_PASSAGES.length);
    // Each passage key must be something the retrieval can actually emit. Union a
    // day and a night chart so both sect keys are reachable (a chart is one sect).
    const analysis = makeAnalysis();
    const nightKeys = activeFactorKeys(makeChart({ sect: "night" }), analysis);
    const dayKeys = activeFactorKeys(makeChart({ sect: "day" }), analysis);
    const emittable = new Set([...nightKeys, ...dayKeys]);
    for (const p of CLASSICAL_PASSAGES) {
      expect(emittable.has(p.key), `passage key never emittable: ${p.key}`).toBe(true);
    }
  });

  it("selectClassicalPassages returns only active passages, capped and spine-first", async () => {
    const sel = await selectClassicalPassages(makeChart(), makeAnalysis(), { limit: 3 });
    expect(sel.length).toBeLessThanOrEqual(3);
    const active = activeFactorKeys(makeChart(), makeAnalysis());
    for (const p of sel) expect(active.has(p.key)).toBe(true);
    const keys = sel.map((p) => p.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("classicalBrief renders each passage verbatim with its citation", async () => {
    const sel = await selectClassicalPassages(makeChart(), makeAnalysis());
    const brief = classicalBrief(sel);
    if (sel.length) {
      expect(brief).toContain(sel[0].text);
      expect(brief).toContain(sel[0].work);
    }
    expect(classicalBrief([])).toBe("");
  });
});
