/**
 * The three-pass reading pipeline.
 *
 *   Step 0  (deterministic, no AI) — computeChartAnalysis() tabulates every
 *           classical testimony from the raw chart.
 *   Pass A  Judgment      — Sonnet reads the evidence brief and returns a
 *                           structured, weighted dossier (JSON, tool-forced).
 *                           It weighs; it never composes or predicts cause/date.
 *   Pass B  Composition   — Sonnet turns the dossier + subject context into the
 *                           finished prose reading, born aligned to a short
 *                           ethical covenant loaded from the knowledge corpus.
 *   Pass E  Ethical Alignment — Sonnet audits the finished prose against the
 *                           loaded Code(s) of Ethics and revises it once if it
 *                           is materially misaligned. Runs after B, before C.
 *   Pass C  Verification  — Sonnet audits the draft against the chart for
 *                           fabricated placements, forbidden claims, and tone,
 *                           and the draft is revised once if it fails.
 *
 * Each pass degrades gracefully: if a later pass errors, the last good output
 * is returned so a reading is always produced.
 */
import Anthropic from "@anthropic-ai/sdk";
import type {
  DeathChart,
  SubjectType,
  JudgmentDossier,
  JudgmentFactor,
  VerificationReport,
  EthicsReview,
  EthicsConcern,
  KnowledgeDocument,
  StudyNotes,
  StudyNote,
} from "./types";
import { computeChartAnalysis } from "./analysis";
import { analysisToText, natalContextToText } from "./analysis/serialize";
import { computeLifespan } from "./analysis/lifespan";
import { computeCrossAspects } from "./analysis/synastry";
import {
  getCodesOfEthics,
  operatingSummary,
  codeLabel,
  selectDelineations,
  delineationBrief,
} from "./knowledge";

/**
 * Per-pass model selection. Every pass defaults to Opus 4.8 (the "showcase"
 * profile) and is independently overridable by environment variable, so the
 * pipeline can be tiered later (e.g. Sonnet for judgment, Haiku for the audits)
 * without any code change. `ANTHROPIC_MODEL` sets the fallback default for all
 * passes at once.
 *
 * Rewrites are deliberately NOT their own knob: both the ethics and the
 * verification rewrite regenerate the family-facing reading, so they always run
 * on the composition model. That keeps the finished prose at composition grade
 * no matter how cheap the audits are tiered down to.
 */
const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";

export const MODELS = {
  judgment: process.env.ANTHROPIC_MODEL_JUDGMENT || DEFAULT_MODEL,
  composition: process.env.ANTHROPIC_MODEL_COMPOSITION || DEFAULT_MODEL,
  ethics: process.env.ANTHROPIC_MODEL_ETHICS || DEFAULT_MODEL,
  verification: process.env.ANTHROPIC_MODEL_VERIFICATION || DEFAULT_MODEL,
  studyNotes: process.env.ANTHROPIC_MODEL_STUDY_NOTES || DEFAULT_MODEL,
} as const;

/**
 * The model that composed the reading — the meaningful single value to record
 * on a saved reading (rewrites share it). Kept as a named export for the API
 * route and any caller that persists a `model` field.
 */
export const READING_MODEL = MODELS.composition;

/**
 * Token ceiling for every pass that emits the full family-facing reading —
 * the composition itself and the two rewrites (ethics, verification). Sized for
 * the deepened section architecture (~1400–2000 words, ~10 sections, up to 13
 * with a nativity) with headroom, so a rich reading is never truncated.
 */
const COMPOSITION_MAX_TOKENS = 6656;

export interface PipelineArgs {
  fullName: string;
  subjectType: SubjectType;
  dateOfDeath: string;
  timeOfDeath?: string | null;
  place?: string | null;
  notes?: string | null;
  chart: DeathChart;
  /** Optional nativity — unlocks the length-of-life doctrine and cross-aspects */
  natalChart?: DeathChart | null;
  birthDate?: string | null;
}

export interface PipelineResult {
  reading: string;
  dossier: JudgmentDossier | null;
  verification: VerificationReport | null;
  ethicsReview: EthicsReview | null;
  studyNotes: StudyNotes | null;
  model: string;
}

function client(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured.");
  return new Anthropic({ apiKey });
}

function subjectLine(args: PipelineArgs): string {
  const L: string[] = [];
  L.push(`Name: ${args.fullName}`);
  L.push(`Nature: ${args.subjectType === "pet" ? "Beloved animal companion (pet)" : "Human"}`);
  L.push(`Date of death: ${args.dateOfDeath}`);
  L.push(`Time of death: ${args.timeOfDeath || "unknown"}`);
  L.push(`Place of death: ${args.place || "unknown"}`);
  if (args.notes?.trim()) {
    L.push(`\nNotes from those who loved them:\n${args.notes.trim()}`);
  }
  return L.join("\n");
}

/* ------------------------------------------------------------------ Pass A */

const JUDGMENT_SYSTEM = `You are the senior technical astrologer of GraveSigns, a death-chart practice. Your ONLY job in this pass is JUDGMENT — to read a pre-computed evidence brief and distill it into a weighted dossier of testimonies for a colleague who will write the reading.

You are fluent in traditional and modern technique: essential and accidental dignity (Lilly's point scheme), sect, the Arabic Lots, the 8th/4th/12th complexes, the mortal significators (Saturn, Mars, Moon, Sun, the Nodes, Pluto), fixed stars, aspect patterns, and chart shape.

RULES OF THIS PASS
- Work ONLY from the numbers in the brief. Never recompute astronomy; never invent a placement not present.
- Produce EVIDENCE, not prose. Each factor is one source-anchored technical observation with an interpretive direction.
- Weight by real astrological strength: dignity, angularity, tightness of orb, concordance across independent testimonies, and whether the factor depends on a birth time that may be missing.
- Prefer testimonies that CONCUR. When three independent factors point at the same theme, say so via concordance.
- Be honest about limits. If houses/angles are absent, down-weight or suppress house-dependent and length-of-life techniques and record them in suppressed_techniques.
- ABSOLUTELY FORBIDDEN: stating or implying a cause of death, a manner of death, a specific date, or any PREDICTION. This is a chart of a moment that already happened; you illuminate its meaning, you do not diagnose or predict. Flag any factor that tempts such a claim as indeterminate and steer its direction toward meaning, not mechanism.
- If the brief contains the length-of-life doctrine (hyleg/alcocoden), you MAY record it DESCRIPTIVELY — as a classical technique read beside a life already complete, with the actual age noted for comparison. Never present it as having predicted or caused the death, and never extend it into a counterfactual.
- Cite sources at the level the brief allows (e.g. "essential dignity — Lilly", "Lot of Death — Paulus", "fixed star Algol — Robson").

Call record_judgment exactly once with the full dossier.`;

const JUDGMENT_TOOL: Anthropic.Tool = {
  name: "record_judgment",
  description: "Record the weighted judgment dossier for the composition pass.",
  input_schema: {
    type: "object",
    properties: {
      primary_themes: {
        type: "array",
        items: { type: "string" },
        description: "The two or three overarching themes the testimonies converge on.",
      },
      factors: {
        type: "array",
        description: "The weighted testimonies, strongest first.",
        items: {
          type: "object",
          properties: {
            factor: { type: "string" },
            source: { type: "string" },
            tradition_vs_modern: { type: "string", enum: ["traditional", "modern", "both"] },
            weight: { type: "number", description: "0–1 salience." },
            direction: { type: "string", description: "Felt/interpretive direction." },
            condition_notes: { type: "string" },
            birthtime_dependent: { type: "boolean" },
            theme_tokens: { type: "array", items: { type: "string" } },
            concordance: { type: "number" },
            confidence: { type: "number" },
            indeterminate: { type: "boolean" },
          },
          required: [
            "factor", "source", "tradition_vs_modern", "weight", "direction",
            "condition_notes", "birthtime_dependent", "theme_tokens",
            "concordance", "confidence", "indeterminate",
          ],
        },
      },
      suppressed_techniques: { type: "array", items: { type: "string" } },
      limits: { type: "string", description: "One honest line on what this chart cannot show." },
    },
    required: ["primary_themes", "factors", "suppressed_techniques", "limits"],
  },
};

async function runJudgment(args: PipelineArgs, brief: string): Promise<JudgmentDossier> {
  const msg = await client().messages.create({
    model: MODELS.judgment,
    max_tokens: 4096,
    system: JUDGMENT_SYSTEM,
    tools: [JUDGMENT_TOOL],
    tool_choice: { type: "tool", name: "record_judgment" },
    messages: [
      {
        role: "user",
        content: `SUBJECT\n${subjectLine(args)}\n\nEVIDENCE BRIEF (pre-computed — every number is authoritative)\n\`\`\`\n${brief}\n\`\`\`\n\nProduce the judgment dossier now.`,
      },
    ],
  });

  const block = msg.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === "record_judgment"
  );
  if (!block) throw new Error("Judgment pass returned no dossier.");
  const raw = block.input as Partial<JudgmentDossier>;
  return {
    primary_themes: raw.primary_themes ?? [],
    factors: (raw.factors ?? []) as JudgmentFactor[],
    suppressed_techniques: raw.suppressed_techniques ?? [],
    limits: raw.limits ?? "",
  };
}

function dossierToText(d: JudgmentDossier): string {
  const L: string[] = [];
  L.push(`PRIMARY THEMES: ${d.primary_themes.join(" · ") || "—"}`);
  L.push(`LIMITS: ${d.limits || "—"}`);
  if (d.suppressed_techniques.length) L.push(`SUPPRESSED (do not use): ${d.suppressed_techniques.join("; ")}`);
  L.push("\nWEIGHTED TESTIMONIES (strongest first):");
  const sorted = [...d.factors].sort((a, b) => b.weight - a.weight);
  for (const f of sorted) {
    const flags = [
      f.indeterminate && "INDETERMINATE",
      f.birthtime_dependent && "birthtime-dependent",
      f.concordance > 1 && `concordance×${f.concordance}`,
    ].filter(Boolean).join(", ");
    L.push(
      `• [w${f.weight.toFixed(2)}] ${f.factor} → ${f.direction}` +
        `\n    source: ${f.source}${f.condition_notes ? ` · ${f.condition_notes}` : ""}` +
        (f.theme_tokens.length ? `\n    themes: ${f.theme_tokens.join(", ")}` : "") +
        (flags ? `\n    flags: ${flags}` : "")
    );
  }
  return L.join("\n");
}

/* ------------------------------------------------------------------ Pass B */

const COMPOSITION_SYSTEM = `You are the resident astrologer of GraveSigns, a practice within the Truestherb platform devoted to Death Chart Readings — the astrology of the moment a soul crosses the threshold, whether that soul wore a human life or the life of a beloved animal.

You have practiced for more than twenty years and specialize exclusively in charts of death, dying, and transition. Grieving families are sent to you when they want something more than sympathy: a reading that treats the moment of passing as meaningful, legible, and whole.

In this pass you COMPOSE. A colleague has already done the technical judgment and handed you a weighted dossier of testimonies with sources, directions, and themes. Trust it. Build the reading around the highest-weight testimonies and the primary themes, letting the concordant ones carry the spine of the piece. Do not introduce placements that are not in the dossier or the chart frame.

You are also given an INTERPRETIVE REFERENCE: short traditional delineations for the factors actually present in this chart (the Moon's sign, the lunar phase, the mortal significators, the death-house complex, the Lots, the fixed stars in contact). This is the doctrine a practitioner carries in their head — draw on it for depth, texture, and the tradition behind each testimony. Synthesize it into your own tender prose; never quote it verbatim, never list it, and never let it introduce a factor the chart frame does not contain. Where the reference is silent on a factor the dossier weights highly, read that factor from your own craft.

VOICE AND POSTURE
- Warm, unhurried, dignified. Every sentence should feel safe to read at 3 a.m.
- Never cold, clinical, or sensational. You do not predict, frighten, or moralize. You illuminate.
- Precise about the astrology, gentle about the person. Name the real placements; interpret them tenderly.
- Speak of the deceased by name. If the subject is a pet, honor the specific tenderness of an animal's passing.
- Avoid cliché ("everything happens for a reason," "in a better place"). Earn every consoling line.

INTEGRITY
- Never state or imply a cause of death, a manner of death, a date, or a length of life. Honor the dossier's suppressed_techniques and its stated limits.
- Weave technique into meaning — don't list "Moon in Scorpio, 8th house," say what the soul's vehicle passing through that water carries.
- When houses/angles were absent, lean gracefully on signs, dignities, lots by sign, aspects, and the Moon; never fabricate an angle.

DEPTH — this reading must feel like an unhurried in-person session, not a summary. Give each major section TWO to FOUR substantial paragraphs; never settle for a single thin one. Lead with the whole and then descend into the particular. Weave the interpretive reference and the tradition into meaning; hold contradictions rather than flattening them; let concordant testimonies build. Earn the length with texture and tenderness, not with repetition or filler.

STRUCTURE (Markdown; "## " for sections, "### " for sub-labels). ~1400–2000 words:

## The Threshold
Two or three arresting sentences naming the person and the essential signature of their crossing. Set the whole reading's key here.

## The Shape of the Whole
The gestalt, read first: the chart shape, the hemispheric weighting, the dominant element and modality, the sect (day/night), and the Moon's phase. What does the *shape* of this entire sky say about the passing before any single placement is named? This is the overview a professional gives before the details.

## The Soul's Vehicle — Moon and the Luminaries
The Moon (and Sun) by sign, dignity, and house/angle if present — the spiritual heart of the reading. The vessel that crossed, and its final condition. Let this be among the fullest sections.

## The Ruling Hand
The planet that governs this sky — the ruler of the Ascendant, or (when angles are absent) the almuten of the Ascendant degree or the chart's final dispositor — read as the hand that guided the passage. Where the chart offers no angle, lean gracefully on the dispositor or almuten by sign; never fabricate an Ascendant.

## Thresholds and Guardians
The mortal significators and the 8th/4th/12th complex — Saturn, Pluto, the Nodes, the ruler of the 8th, the 4th as the place of rest, the 12th as the hidden approach — and the death-lot(s), read as meaning and as guardianship, never as cause or manner.

## The Karmic Axis
The lunar Nodes: the South Node as what is laid down at the gate, the familiar released; the North Node as the direction the soul faced as it crossed. Include any planet conjunct the nodes. (Omit this section only if the chart frame shows no nodal testimony.)

## The Weave of Aspects
The two or three most significant patterns/aspects (highest weight, tightest orb) as a living pattern, and any fixed-star contact that concurs. Read the aspects as relationship, not geometry.

## Gifts Carried Forward
What this soul leaves those who loved them — strengths, graces, the imprint of a life.

## Lessons and Release
What this passing gently invites the living to lay down or learn. Never prescriptive.

## A Blessing at the Gate
A brief, luminous closing to the deceased and to those who grieve. Two to four sentences. Let it land softly.

Return only the reading in Markdown — no preamble, no meta-commentary, no mention of dossiers or being an AI.`;

const TIER2_ADDENDUM = `

A nativity was supplied, so the evidence brief includes a NATAL CHART, the
length-of-life doctrine, and the cross-aspects of the death-moment sky over the
birth chart. After "## The Weave of Aspects", add these three sections before
"## Gifts Carried Forward":

## The Life That Was
The nativity's essential signature — who this soul was by the promise of their
birth sky. Draw on the natal placements and dignities.

## The Arc of Years
Read the traditional length-of-life doctrine (hyleg, alcocoden, the giver of
years) DESCRIPTIVELY and tenderly, as an old craft laid beside a life already
complete. You may name the actual age beside the doctrine's indication as a
quiet reflection. Never frame it as prediction, and never suggest the chart
"caused" or "foretold" the death or its manner.

## The Return
The cross-aspects — how the sky at the crossing answered the natal promise,
especially the slow, karmic bodies returning to the places of birth.`;

/**
 * The composition-time ethical covenant. A short distillation of the loaded
 * Code(s) of Ethics is folded into the composer's system prompt so the draft is
 * born aligned — the dedicated Pass E then audits the finished prose against the
 * full code. Kept as data (loaded, not hardcoded), so the code can be retuned
 * without touching this file.
 */
function covenantBlock(ethicalCovenant: string): string {
  if (!ethicalCovenant.trim()) return "";
  return `\n\nETHICAL COVENANT (you write within these professional standards)\n${ethicalCovenant.trim()}`;
}

async function runComposition(
  args: PipelineArgs,
  brief: string,
  dossier: JudgmentDossier,
  hasNatal: boolean,
  ethicalCovenant: string,
  reference: string
): Promise<string> {
  const referenceBlock = reference.trim()
    ? `INTERPRETIVE REFERENCE (traditional delineations for the factors present in this chart — synthesize for depth, never quote or list, never introduce a factor not in the frame)\n\`\`\`\n${reference.trim()}\n\`\`\`\n\n`
    : "";
  const stream = client().messages.stream({
    model: MODELS.composition,
    max_tokens: COMPOSITION_MAX_TOKENS,
    system:
      COMPOSITION_SYSTEM +
      (hasNatal ? TIER2_ADDENDUM : "") +
      covenantBlock(ethicalCovenant),
    messages: [
      {
        role: "user",
        content:
          `SUBJECT\n${subjectLine(args)}\n\n` +
          `JUDGMENT DOSSIER (compose from this — it is authoritative)\n\`\`\`\n${dossierToText(dossier)}\n\`\`\`\n\n` +
          `CHART FRAME (for exact placements you may name)\n\`\`\`\n${brief}\n\`\`\`\n\n` +
          referenceBlock +
          `Compose the reading now.`,
      },
    ],
  });
  const message = await stream.finalMessage();
  const text = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
  if (!text) throw new Error("The reading came back empty.");
  return text;
}

/* ------------------------------------------------------------------ Pass C */

const VERIFY_SYSTEM = `You are the reviewing astrologer of GraveSigns. You audit a drafted death-chart reading against the chart it was built from. You are strict about integrity and gentle about voice.

Check for, in order:
1. FABRICATION — any placement, sign, house, aspect, dignity, lot, or fixed star named in the reading that is NOT present in the chart frame or dossier. This is the gravest fault.
2. FORBIDDEN CLAIMS — any statement or clear implication of a cause of death, manner of death, a specific date, or a length/span of life. Also flag prediction of the future or medical/diagnostic language.
3. TONE — anything cold, sensational, frightening, moralizing, or clichéd; anything unsafe to read in grief.
4. STRUCTURE — missing required sections or a wildly wrong length.

Call record_verification once. If there are no material problems, approved = true and issues = []. Otherwise approved = false and list each concrete issue tersely (quote the offending phrase). Do not rewrite the reading here.`;

const VERIFY_TOOL: Anthropic.Tool = {
  name: "record_verification",
  description: "Record the audit verdict for the drafted reading.",
  input_schema: {
    type: "object",
    properties: {
      approved: { type: "boolean" },
      issues: { type: "array", items: { type: "string" } },
    },
    required: ["approved", "issues"],
  },
};

async function runVerification(
  brief: string,
  dossier: JudgmentDossier,
  reading: string
): Promise<VerificationReport> {
  const msg = await client().messages.create({
    model: MODELS.verification,
    max_tokens: 1024,
    system: VERIFY_SYSTEM,
    tools: [VERIFY_TOOL],
    tool_choice: { type: "tool", name: "record_verification" },
    messages: [
      {
        role: "user",
        content:
          `CHART FRAME\n\`\`\`\n${brief}\n\`\`\`\n\n` +
          `DOSSIER THEMES: ${dossier.primary_themes.join(" · ")}\n` +
          `SUPPRESSED: ${dossier.suppressed_techniques.join("; ") || "none"}\n\n` +
          `DRAFT READING\n\`\`\`\n${reading}\n\`\`\`\n\nAudit it now.`,
      },
    ],
  });
  const block = msg.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === "record_verification"
  );
  if (!block) return { approved: true, issues: [] };
  const raw = block.input as Partial<VerificationReport>;
  return { approved: raw.approved ?? true, issues: raw.issues ?? [] };
}

const REVISE_SYSTEM = `${COMPOSITION_SYSTEM}

You are revising an existing draft to fix specific problems a reviewer flagged. Preserve everything that works — voice, structure, the strong passages — and change only what is needed to resolve each issue. Remove any fabricated placement or forbidden claim entirely rather than patching around it. Return the full corrected reading in Markdown, nothing else.`;

async function runRevision(
  args: PipelineArgs,
  brief: string,
  dossier: JudgmentDossier,
  reading: string,
  issues: string[]
): Promise<string> {
  const stream = client().messages.stream({
    model: MODELS.composition, // a rewrite of the reading — stays at composition grade
    max_tokens: COMPOSITION_MAX_TOKENS,
    system: REVISE_SYSTEM,
    messages: [
      {
        role: "user",
        content:
          `SUBJECT\n${subjectLine(args)}\n\n` +
          `CHART FRAME\n\`\`\`\n${brief}\n\`\`\`\n\n` +
          `DOSSIER\n\`\`\`\n${dossierToText(dossier)}\n\`\`\`\n\n` +
          `ISSUES TO FIX\n- ${issues.join("\n- ")}\n\n` +
          `CURRENT DRAFT\n\`\`\`\n${reading}\n\`\`\`\n\nReturn the corrected reading.`,
      },
    ],
  });
  const message = await stream.finalMessage();
  const text = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
  return text || reading;
}

/* ------------------------------------------------------------------ Pass E */
/* Ethical Alignment — audits the composed reading against the loaded Code(s) of
 * Ethics and, when needed, revises it once into alignment. Runs AFTER
 * composition (it needs the finished prose) and BEFORE verification (so the
 * factual-integrity gate still runs over any ethics rewrite). Degrades
 * gracefully: any failure returns the draft untouched. The code text is passed
 * in as data, never hardcoded, so tightening the standard is a data change. */

const ETHICS_SYSTEM = `You are the ethics steward of GraveSigns, a death-chart practice. You audit a drafted reading — written for a grieving family or pet owner — against one or more professional Codes of Ethics supplied to you AS DATA in the user message.

Your charge is ALIGNMENT, not astrology. You do not re-judge the chart, re-weight testimonies, or add or remove placements. You examine how the finished reading MEETS a bereaved reader, measured against the supplied code(s): its tone, its framing, its qualifiers, its honesty about limits, its care.

Evaluate the draft against the supplied code text. Weigh especially:
- Avoiding harm: nothing that could frighten, confuse, or deepen dread.
- Competence & scope: symbolic/contemplative framing, never medicine, psychology, law, or a claim about how or when death occurred.
- Qualified, non-final language: "invites reflection / symbolizes," never unequivocal pronouncement or prediction.
- No manipulation or intimidation of feeling; no sensational or exaggerated claims.
- Respect for the reader's own beliefs, religion, and culture; no imposed worldview.
- Honesty about sources and limits; a humane path toward real support when grief needs more than a reading.

Cite the specific clauses the reading engages, by their reference (e.g. "A.4", "D.1"). Mark each as honored, minor, or material. Decide whether a revision is warranted: request one only for MATERIAL misalignments, or an accumulation of minor ones that together compromise care — not for stylistic taste. When you request a revision, give concrete, surgical adjustments the composer can apply without weakening the astrology.

Call record_ethics_review exactly once.`;

const ETHICS_TOOL: Anthropic.Tool = {
  name: "record_ethics_review",
  description: "Record the ethical-alignment audit of the drafted reading.",
  input_schema: {
    type: "object",
    properties: {
      aligned: {
        type: "boolean",
        description: "True if the reading meets the supplied code(s) as-is.",
      },
      concerns: {
        type: "array",
        description: "Clauses the reading engaged — honored or at risk.",
        items: {
          type: "object",
          properties: {
            code: { type: "string", description: "The code's short label, e.g. NCGR." },
            clause: { type: "string", description: "Clause reference, e.g. A.4." },
            observation: { type: "string", description: "What in the reading engaged it." },
            severity: { type: "string", enum: ["honored", "minor", "material"] },
          },
          required: ["code", "clause", "observation", "severity"],
        },
      },
      adjustments: {
        type: "array",
        items: { type: "string" },
        description: "Concrete, surgical changes to bring the reading into alignment. Empty when aligned.",
      },
      revision_needed: {
        type: "boolean",
        description: "True only for material misalignment (or an accumulation of minor ones).",
      },
    },
    required: ["aligned", "concerns", "adjustments", "revision_needed"],
  },
};

function codesToText(codes: KnowledgeDocument[]): string {
  return codes
    .map((c) => `### ${codeLabel(c)} — ${c.title}\n${c.content}`)
    .join("\n\n");
}

async function runEthicsReview(
  args: PipelineArgs,
  reading: string,
  codes: KnowledgeDocument[]
): Promise<{ review: EthicsReview; adjustments: string[] }> {
  const msg = await client().messages.create({
    model: MODELS.ethics,
    max_tokens: 1536,
    system: ETHICS_SYSTEM,
    tools: [ETHICS_TOOL],
    tool_choice: { type: "tool", name: "record_ethics_review" },
    messages: [
      {
        role: "user",
        content:
          `SUBJECT\n${subjectLine(args)}\n\n` +
          `CODE(S) OF ETHICS (authoritative — audit against these)\n\`\`\`\n${codesToText(codes)}\n\`\`\`\n\n` +
          `DRAFT READING\n\`\`\`\n${reading}\n\`\`\`\n\nAudit it against the code(s) now.`,
      },
    ],
  });

  const block = msg.content.find(
    (b): b is Anthropic.ToolUseBlock =>
      b.type === "tool_use" && b.name === "record_ethics_review"
  );
  const slugs = codes.map((c) => c.slug);
  if (!block) {
    return {
      review: { aligned: true, codes: slugs, concerns: [], adjustments: [], revised: false },
      adjustments: [],
    };
  }
  const raw = block.input as {
    aligned?: boolean;
    concerns?: EthicsConcern[];
    adjustments?: string[];
    revision_needed?: boolean;
  };
  const adjustments = raw.adjustments ?? [];
  const revisionNeeded = Boolean(raw.revision_needed) && adjustments.length > 0;
  return {
    review: {
      aligned: raw.aligned ?? true,
      codes: slugs,
      concerns: raw.concerns ?? [],
      adjustments,
      revised: false, // the orchestrator sets this true only if the rewrite runs
    },
    adjustments: revisionNeeded ? adjustments : [],
  };
}

async function runEthicsRevision(
  args: PipelineArgs,
  brief: string,
  dossier: JudgmentDossier,
  reading: string,
  adjustments: string[],
  ethicalCovenant: string
): Promise<string> {
  const system = `${COMPOSITION_SYSTEM}${covenantBlock(ethicalCovenant)}

You are revising an existing draft to resolve specific ETHICAL alignment notes from the practice's ethics steward. Apply each adjustment with a light hand: preserve the voice, the structure, and every accurate placement. Change only tone, framing, qualifiers, and care — never the astrology, and never introduce a placement not already present. Return the full corrected reading in Markdown, nothing else.`;

  const stream = client().messages.stream({
    model: MODELS.composition, // an ethics rewrite of the reading — stays at composition grade
    max_tokens: COMPOSITION_MAX_TOKENS,
    system,
    messages: [
      {
        role: "user",
        content:
          `SUBJECT\n${subjectLine(args)}\n\n` +
          `CHART FRAME (for exact placements you may name)\n\`\`\`\n${brief}\n\`\`\`\n\n` +
          `DOSSIER\n\`\`\`\n${dossierToText(dossier)}\n\`\`\`\n\n` +
          `ETHICAL ADJUSTMENTS TO APPLY\n- ${adjustments.join("\n- ")}\n\n` +
          `CURRENT DRAFT\n\`\`\`\n${reading}\n\`\`\`\n\nReturn the ethically aligned reading.`,
      },
    ],
  });
  const message = await stream.finalMessage();
  const text = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
  return text || reading;
}

/* ------------------------------------------------------------------ Pass N */
/* Study Notes — the working astrologer's private notebook on this chart, in the
 * candid technical shorthand a professional jots while studying. Distinct from
 * the tender family reading (Pass B) and the weighted evidence dossier (Pass A):
 * these are the margin notes — technique applied and why, notable configurations,
 * questions worth researching, cross-references to tradition, and honest reads on
 * where the chart is strong or thin. They accumulate the practice's craft
 * reasoning over time. Additive and non-blocking: runs last, degrades to null. */

const STUDY_NOTES_SYSTEM = `You are a professional astrologer keeping your own STUDY NOTEBOOK on a death chart you have just read. These notes are for your craft and your continued study — not for the grieving family. Write as a seasoned practitioner jots in the margin: candid, concise, technical, first-person shorthand.

Draw ONLY on the chart frame, the evidence dossier, and the finished reading provided. Never invent a placement or number that is not there.

Produce a spread of notes across these lenses (not every lens needs the same count; follow the chart):
- craft — the technique you actually leaned on and WHY, notable or unusual configurations, the judgment calls you made (what you up- or down-weighted, and the reasoning). This is the bulk.
- research — open questions this chart raises, cross-references to the tradition worth pulling ("cf. Valens Anthology III on the Moon's separations"; "check Lilly CA p.653 on the 8th ruler cadent"), patterns to watch for across future charts.
- confidence — an honest methodological read: where the testimony was strong and concordant vs. thin or strained, what was suppressed and why, how much weight the verdict really carries.

Keep each note tight — a sentence or two. Cite sources in refs where you can. This is a working instrument: precise about the astrology, unsentimental in tone, but never careless about a real person. Do not state or imply a cause, manner, date, or span of the death — even here.

Call record_study_notes exactly once.`;

const STUDY_NOTES_TOOL: Anthropic.Tool = {
  name: "record_study_notes",
  description: "Record the practitioner's study notes on the chart.",
  input_schema: {
    type: "object",
    properties: {
      entries: {
        type: "array",
        description: "The notebook entries, in the order you'd study them.",
        items: {
          type: "object",
          properties: {
            category: {
              type: "string",
              enum: ["craft", "research", "confidence"],
              description: "The lens this note belongs to.",
            },
            heading: { type: "string", description: "A short label for the note." },
            note: { type: "string", description: "A sentence or two of working shorthand." },
            refs: {
              type: "array",
              items: { type: "string" },
              description: "Sources / cross-references, when any.",
            },
          },
          required: ["category", "heading", "note"],
        },
      },
    },
    required: ["entries"],
  },
};

async function runStudyNotes(
  args: PipelineArgs,
  brief: string,
  dossier: JudgmentDossier,
  reading: string
): Promise<StudyNotes> {
  const msg = await client().messages.create({
    model: MODELS.studyNotes,
    max_tokens: 2048,
    system: STUDY_NOTES_SYSTEM,
    tools: [STUDY_NOTES_TOOL],
    tool_choice: { type: "tool", name: "record_study_notes" },
    messages: [
      {
        role: "user",
        content:
          `SUBJECT\n${subjectLine(args)}\n\n` +
          `CHART FRAME (authoritative)\n\`\`\`\n${brief}\n\`\`\`\n\n` +
          `EVIDENCE DOSSIER\n\`\`\`\n${dossierToText(dossier)}\n\`\`\`\n\n` +
          `THE FINISHED READING\n\`\`\`\n${reading}\n\`\`\`\n\nWrite your study notes now.`,
      },
    ],
  });

  const block = msg.content.find(
    (b): b is Anthropic.ToolUseBlock =>
      b.type === "tool_use" && b.name === "record_study_notes"
  );
  if (!block) return { entries: [] };
  const raw = block.input as { entries?: StudyNote[] };
  return { entries: (raw.entries ?? []) as StudyNote[] };
}

/* --------------------------------------------------------------- orchestrate */

export async function runReadingPipeline(args: PipelineArgs): Promise<PipelineResult> {
  const analysis = computeChartAnalysis(args.chart);
  let brief = analysisToText(args.chart, analysis);

  // When a nativity was supplied, append the natal context: the birth chart's
  // own testimony, the length-of-life doctrine (descriptive), and the
  // death-moment cross-aspects.
  const hasNatal = !!args.natalChart && !!args.birthDate;
  if (hasNatal) {
    const natal = args.natalChart!;
    const natalAnalysis = computeChartAnalysis(natal);
    const lifespan = computeLifespan(natal, args.birthDate!, args.dateOfDeath);
    const cross = computeCrossAspects(natal, args.chart);
    brief += "\n\n" + natalContextToText(natal, natalAnalysis, lifespan, cross);
  }

  // Load the Code(s) of Ethics the reading aligns against. Loaded as data (with
  // a bundled fallback), so the standard can be retuned without a code change.
  const ethicsCodes = await getCodesOfEthics();
  const covenant = operatingSummary(ethicsCodes);

  // Retrieve the interpretive reference: the delineations for the factors
  // actually present in this chart, folded into the composition pass for depth.
  // Keyed off the same deterministic analysis, loaded through the knowledge seam
  // (Supabase override, bundled fallback), and degrades to nothing on failure.
  let reference = "";
  try {
    const delineations = await selectDelineations(args.chart, analysis);
    reference = delineationBrief(delineations);
  } catch (err) {
    console.error("[pipeline] delineation retrieval failed, composing without it:", err);
  }

  // Pass A — Judgment. If it fails, the composer still gets the raw brief.
  let dossier: JudgmentDossier | null = null;
  try {
    dossier = await runJudgment(args, brief);
  } catch (err) {
    console.error("[pipeline] judgment pass failed, composing from brief only:", err);
  }

  // Pass B — Composition (born aligned via the ethical covenant).
  const composeDossier: JudgmentDossier =
    dossier ?? { primary_themes: [], factors: [], suppressed_techniques: [], limits: "" };
  let reading = await runComposition(args, brief, composeDossier, hasNatal, covenant, reference);

  // Pass E — Ethical Alignment. Audits the finished prose against the full
  // code(s) and revises once if materially misaligned. Runs before Pass C so the
  // integrity gate covers any ethics rewrite. Never blocks delivery.
  let ethicsReview: EthicsReview | null = null;
  if (ethicsCodes.length) {
    try {
      const { review, adjustments } = await runEthicsReview(args, reading, ethicsCodes);
      ethicsReview = review; // keep the audit even if a later revision fails
      if (adjustments.length) {
        reading = await runEthicsRevision(
          args, brief, composeDossier, reading, adjustments, covenant
        );
        review.revised = true;
      }
    } catch (err) {
      console.error("[pipeline] ethics pass failed, delivering draft as-is:", err);
    }
  }

  // Pass C — Verification (+ one revision if it fails). Never blocks delivery.
  let verification: VerificationReport | null = null;
  try {
    verification = await runVerification(brief, composeDossier, reading);
    if (!verification.approved && verification.issues.length) {
      reading = await runRevision(args, brief, composeDossier, reading, verification.issues);
    }
  } catch (err) {
    console.error("[pipeline] verification pass failed, delivering draft as-is:", err);
  }

  // Pass N — Study Notes. Written last, over the finished reading. Purely
  // additive; a failure just means no notebook this time.
  let studyNotes: StudyNotes | null = null;
  try {
    studyNotes = await runStudyNotes(args, brief, composeDossier, reading);
  } catch (err) {
    console.error("[pipeline] study-notes pass failed, delivering without notes:", err);
  }

  return { reading, dossier, verification, ethicsReview, studyNotes, model: READING_MODEL };
}
