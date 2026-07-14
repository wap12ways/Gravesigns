/**
 * The three-pass reading pipeline.
 *
 *   Step 0  (deterministic, no AI) — computeChartAnalysis() tabulates every
 *           classical testimony from the raw chart.
 *   Pass A  Judgment      — Sonnet reads the evidence brief and returns a
 *                           structured, weighted dossier (JSON, tool-forced).
 *                           It weighs; it never composes or predicts cause/date.
 *   Pass B  Composition   — Sonnet turns the dossier + subject context into the
 *                           finished prose reading.
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
} from "./types";
import { computeChartAnalysis } from "./analysis";
import { analysisToText, natalContextToText } from "./analysis/serialize";
import { computeLifespan } from "./analysis/lifespan";
import { computeCrossAspects } from "./analysis/synastry";

export const READING_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

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
    model: READING_MODEL,
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

STRUCTURE (Markdown; "## " for sections, "### " for sub-labels). ~800–1200 words:

## The Threshold
Two or three arresting sentences naming the person and the essential signature of their crossing.

## The Sky at the Crossing
The whole-chart portrait — sect, dominant element/modality, chart shape, Moon phase — and what the shape of the whole says about this passing.

## The Soul's Vehicle — Moon and the Luminaries
The Moon (and Sun) by sign, dignity, and house/angle if present. The spiritual heart of the reading.

## Thresholds and Guardians
The mortal significators and the 8th/4th/12th complex — Saturn, Pluto, the Nodes, the ruler of the 8th — and the death-lot(s), read as meaning.

## The Weave of Aspects
The two or three most significant patterns/aspects (highest weight, tightest orb) as a living pattern, and any fixed-star contact that concurs.

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

async function runComposition(
  args: PipelineArgs,
  brief: string,
  dossier: JudgmentDossier,
  hasNatal: boolean
): Promise<string> {
  const stream = client().messages.stream({
    model: READING_MODEL,
    max_tokens: 4608,
    system: COMPOSITION_SYSTEM + (hasNatal ? TIER2_ADDENDUM : ""),
    messages: [
      {
        role: "user",
        content:
          `SUBJECT\n${subjectLine(args)}\n\n` +
          `JUDGMENT DOSSIER (compose from this — it is authoritative)\n\`\`\`\n${dossierToText(dossier)}\n\`\`\`\n\n` +
          `CHART FRAME (for exact placements you may name)\n\`\`\`\n${brief}\n\`\`\`\n\n` +
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
    model: READING_MODEL,
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
    model: READING_MODEL,
    max_tokens: 4096,
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

  // Pass A — Judgment. If it fails, the composer still gets the raw brief.
  let dossier: JudgmentDossier | null = null;
  try {
    dossier = await runJudgment(args, brief);
  } catch (err) {
    console.error("[pipeline] judgment pass failed, composing from brief only:", err);
  }

  // Pass B — Composition.
  const composeDossier: JudgmentDossier =
    dossier ?? { primary_themes: [], factors: [], suppressed_techniques: [], limits: "" };
  let reading = await runComposition(args, brief, composeDossier, hasNatal);

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

  return { reading, dossier, verification, model: READING_MODEL };
}
