import fs from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";
import { MODEL_DEFAULTS } from "@/config/models";
import { db, isDbConfigured } from "./supabase";

/**
 * The single door to the Anthropic API.
 *
 * Every Claude call in the app goes through `askClaude`. It handles retries on
 * transient failures, validates the response against a Zod schema, and logs
 * tokens used to the claude_calls table. Nothing else in the codebase imports
 * the Anthropic SDK.
 */

let client: Anthropic | null = null;

function anthropic(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set. Copy .env.example to .env.local.");
  }
  if (!client) client = new Anthropic();
  return client;
}

/** Prompts live as editable .md files, read fresh so edits apply on reload. */
export function loadPrompt(name: string): string {
  const file = path.join(process.cwd(), "src", "prompts", `${name}.md`);
  return fs.readFileSync(file, "utf8");
}

/** Fill `{{placeholder}}` slots in a prompt template. */
export function fillPrompt(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) =>
    key in vars ? vars[key] : match,
  );
}

interface AskOptions<T extends z.ZodTypeAny> {
  /** Free-form label for the log, e.g. "analysis" or "estimate". */
  purpose: string;
  model: string;
  system: string;
  user: string;
  schema: T;
  /** Row this call is about, for tracing in claude_calls. */
  refId?: string;
  maxTokens?: number;
  effort?: "low" | "medium" | "high" | "xhigh" | "max";
  maxAttempts?: number;
}

const RETRY_BASE_MS = 1500;

function isRetryable(error: unknown): boolean {
  if (error instanceof Anthropic.RateLimitError) return true;
  if (error instanceof Anthropic.APIConnectionError) return true;
  if (error instanceof Anthropic.APIError) return (error.status ?? 0) >= 500;
  // Schema validation failures are worth one more shot — the model may just
  // have dropped a field.
  return error instanceof SchemaError;
}

export class SchemaError extends Error {}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Ask Claude for a JSON object matching `schema`. Returns the parsed object.
 * Throws after the last attempt.
 */
export async function askClaude<T extends z.ZodTypeAny>(
  opts: AskOptions<T>,
): Promise<z.infer<T>> {
  const maxAttempts = opts.maxAttempts ?? 3;
  const started = Date.now();
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await anthropic().messages.parse({
        model: opts.model,
        max_tokens: opts.maxTokens ?? MODEL_DEFAULTS.maxTokens,
        thinking: { type: "adaptive" },
        output_config: {
          effort: opts.effort ?? MODEL_DEFAULTS.effort,
          format: zodOutputFormat(opts.schema),
        },
        system: opts.system,
        messages: [{ role: "user", content: opts.user }],
      });

      if (response.stop_reason === "refusal") {
        throw new Error(
          `Claude declined the request (${response.stop_details?.category ?? "unknown"}).`,
        );
      }
      if (response.parsed_output == null) {
        throw new SchemaError("Response did not parse against the expected schema.");
      }

      await logCall({
        purpose: opts.purpose,
        model: opts.model,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        cacheReadTokens: response.usage.cache_read_input_tokens ?? null,
        durationMs: Date.now() - started,
        attempts: attempt,
        ok: true,
        refId: opts.refId,
      });

      return response.parsed_output as z.infer<T>;
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts && isRetryable(error)) {
        await sleep(RETRY_BASE_MS * 2 ** (attempt - 1));
        continue;
      }
      break;
    }
  }

  await logCall({
    purpose: opts.purpose,
    model: opts.model,
    durationMs: Date.now() - started,
    attempts: maxAttempts,
    ok: false,
    error: lastError instanceof Error ? lastError.message : String(lastError),
    refId: opts.refId,
  });
  throw lastError;
}

/** Same wrapper, plain prose out. Used for the cover-letter narrative. */
export async function askClaudeText(opts: Omit<AskOptions<z.ZodTypeAny>, "schema">): Promise<string> {
  const started = Date.now();
  const maxAttempts = opts.maxAttempts ?? 3;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await anthropic().messages.create({
        model: opts.model,
        max_tokens: opts.maxTokens ?? MODEL_DEFAULTS.maxTokens,
        thinking: { type: "adaptive" },
        output_config: { effort: opts.effort ?? MODEL_DEFAULTS.effort },
        system: opts.system,
        messages: [{ role: "user", content: opts.user }],
      });

      if (response.stop_reason === "refusal") {
        throw new Error(
          `Claude declined the request (${response.stop_details?.category ?? "unknown"}).`,
        );
      }

      const text = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();

      await logCall({
        purpose: opts.purpose,
        model: opts.model,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        cacheReadTokens: response.usage.cache_read_input_tokens ?? null,
        durationMs: Date.now() - started,
        attempts: attempt,
        ok: true,
        refId: opts.refId,
      });

      return text;
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts && isRetryable(error)) {
        await sleep(RETRY_BASE_MS * 2 ** (attempt - 1));
        continue;
      }
      break;
    }
  }

  await logCall({
    purpose: opts.purpose,
    model: opts.model,
    durationMs: Date.now() - started,
    attempts: maxAttempts,
    ok: false,
    error: lastError instanceof Error ? lastError.message : String(lastError),
    refId: opts.refId,
  });
  throw lastError;
}

interface CallLog {
  purpose: string;
  model: string;
  inputTokens?: number | null;
  outputTokens?: number | null;
  cacheReadTokens?: number | null;
  durationMs: number;
  attempts: number;
  ok: boolean;
  error?: string;
  refId?: string;
}

/** Best effort — a logging failure must never fail the caller's work. */
async function logCall(entry: CallLog): Promise<void> {
  const line = `[claude] ${entry.purpose} ${entry.model} ${entry.ok ? "ok" : "FAILED"} ` +
    `in=${entry.inputTokens ?? "-"} out=${entry.outputTokens ?? "-"} ` +
    `${entry.durationMs}ms attempts=${entry.attempts}${entry.error ? ` ${entry.error}` : ""}`;
  console.log(line);

  if (!isDbConfigured()) return;
  try {
    await db().from("claude_calls").insert({
      purpose: entry.purpose,
      model: entry.model,
      input_tokens: entry.inputTokens ?? null,
      output_tokens: entry.outputTokens ?? null,
      cache_read_tokens: entry.cacheReadTokens ?? null,
      duration_ms: entry.durationMs,
      attempts: entry.attempts,
      ok: entry.ok,
      error: entry.error ?? null,
      ref_id: entry.refId ?? null,
    });
  } catch (error) {
    console.error("[claude] failed to write token log", error);
  }
}
