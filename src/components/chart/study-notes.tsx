"use client";

import { useState } from "react";
import type { StudyNotes, StudyNote } from "@/lib/types";

/**
 * "The Practitioner's Notebook" — the working astrologer's study notes on the
 * chart: the craft reasoning, the questions worth researching, and the honest
 * read on where the chart is strong or thin. A transparent companion to the
 * casebook, shown beneath the reading.
 */

const LENS: Record<string, { label: string; hint: string }> = {
  craft: { label: "Craft", hint: "technique, configurations, judgment calls" },
  research: { label: "To Study", hint: "questions and cross-references to pursue" },
  confidence: { label: "Confidence & Limits", hint: "where the chart is strong or thin" },
};

const ORDER = ["craft", "research", "confidence"];

function lensOf(category: string): { label: string; hint: string } {
  return LENS[category] ?? { label: category, hint: "" };
}

export function StudyNotesPanel({ notes }: { notes: StudyNotes }) {
  const [open, setOpen] = useState(false);
  const entries = notes.entries ?? [];
  if (!entries.length) return null;

  // Group by category, ordered craft → research → confidence, then any others.
  const groups = new Map<string, StudyNote[]>();
  for (const e of entries) {
    const key = e.category || "craft";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(e);
  }
  const keys = [
    ...ORDER.filter((k) => groups.has(k)),
    ...[...groups.keys()].filter((k) => !ORDER.includes(k)),
  ];

  const total = entries.length;
  const perGroupCollapsed = 3;
  const hiddenCount = keys.reduce(
    (n, k) => n + Math.max(0, groups.get(k)!.length - perGroupCollapsed),
    0
  );

  return (
    <div>
      <h3 className="font-serif text-2xl gold-text">The Practitioner&rsquo;s Notebook</h3>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        The working notes taken while reading this chart — the craft behind the
        prose, the threads worth studying further, and an honest word on what the
        sky could and couldn&rsquo;t show.
      </p>

      <div className="mt-5 space-y-6">
        {keys.map((key) => {
          const groupNotes = groups.get(key)!;
          const lens = lensOf(key);
          const visible = open ? groupNotes : groupNotes.slice(0, perGroupCollapsed);
          if (!visible.length) return null;
          return (
            <div key={key}>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-base text-gold-light/90">
                  {lens.label}
                </span>
                {lens.hint && (
                  <span className="text-[11px] text-muted-foreground/60">— {lens.hint}</span>
                )}
              </div>
              <div className="mt-2 space-y-2">
                {visible.map((n, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-white/5 bg-black/20 px-4 py-3"
                  >
                    <div className="text-sm text-foreground/90">{n.heading}</div>
                    <div className="mt-1 text-[13px] leading-relaxed text-foreground/70">
                      {n.note}
                    </div>
                    {n.refs && n.refs.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gold/60">
                        {n.refs.map((r, k) => (
                          <span key={k}>{r}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {hiddenCount > 0 && (
        <button
          onClick={() => setOpen((o) => !o)}
          className="mt-5 text-xs tracking-wide text-gold-light/80 hover:text-gold-light"
        >
          {open ? "Show fewer" : `Show all ${total} notes`}
        </button>
      )}
    </div>
  );
}
