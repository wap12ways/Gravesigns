/**
 * Every Claude model id used by the app, in one place.
 *
 * Note on ids: the original build plan named `claude-sonnet-4-6` and
 * `claude-opus-4-6`. Those are superseded — the current generation is
 * `claude-sonnet-5` and `claude-opus-5`, which is what we use here.
 * Override any of these with an environment variable without a code change.
 */

export const MODELS = {
  /** Bid analysis: fit scoring + scope extraction. Sonnet-tier is plenty. */
  analysis: process.env.ANTHROPIC_MODEL_ANALYSIS ?? "claude-sonnet-5",

  /** Mapping scope items onto unit prices. Structured, mechanical work. */
  estimate: process.env.ANTHROPIC_MODEL_ESTIMATE ?? "claude-sonnet-5",

  /** The cover-letter narrative. Prose quality matters, so Opus. */
  narrative: process.env.ANTHROPIC_MODEL_NARRATIVE ?? "claude-opus-5",
} as const;

/** Shared request knobs. */
export const MODEL_DEFAULTS = {
  maxTokens: 16000,
  /** "low" | "medium" | "high" | "xhigh" | "max" */
  effort: "high",
} as const;

/** Characters of attachment text handed to the analysis prompt. */
export const MAX_DOC_CHARS = 60_000;
