"use client";

import { useMemo, useState } from "react";
import type { DeathChart } from "@/lib/types";
import { computeChartAnalysis } from "@/lib/analysis";
import { ELEMENT_COLOR } from "@/lib/glyphs";
import { ChartWheel } from "./chart-wheel";
import { DignitiesTable } from "./dignities-table";
import { Aspectarian } from "./aspectarian";
import { MortalityPanel } from "./mortality-panel";
import { MoonPhaseDisk } from "./moon-phase";

type Tab = "wheel" | "dignities" | "aspects" | "mortality";

const TABS: { id: Tab; label: string }[] = [
  { id: "wheel", label: "The Wheel" },
  { id: "dignities", label: "Dignities" },
  { id: "aspects", label: "Aspects" },
  { id: "mortality", label: "Mortality" },
];

export function ChartPanel({ chart }: { chart: DeathChart }) {
  const [tab, setTab] = useState<Tab>("wheel");
  const analysis = useMemo(() => computeChartAnalysis(chart), [chart]);

  const totalBodies = chart.planets.length;
  const elements = analysis.balance.elements;

  return (
    <div className="space-y-6">
      {/* Always-on header strip: moon phase + elemental balance */}
      <div className="grid gap-5 sm:grid-cols-[auto_1fr] sm:items-center">
        <MoonPhaseDisk chart={chart} />
        <div>
          <div className="mb-1.5 flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            <span>Elemental Balance</span>
            <span>{chart.sect === "day" ? "Diurnal (day) chart" : "Nocturnal (night) chart"}</span>
          </div>
          <div className="flex h-3 overflow-hidden rounded-full border border-white/5">
            {(["Fire", "Earth", "Air", "Water"] as const).map((el) => {
              const pct = totalBodies ? (elements[el] / totalBodies) * 100 : 0;
              return (
                <div
                  key={el}
                  style={{ width: `${pct}%`, backgroundColor: ELEMENT_COLOR[el] }}
                  className="opacity-80"
                  title={`${el}: ${elements[el]}`}
                />
              );
            })}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-muted-foreground">
            {(["Fire", "Earth", "Air", "Water"] as const).map((el) => (
              <span key={el} className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: ELEMENT_COLOR[el] }} />
                {el} {elements[el]}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Segmented control */}
      <div className="flex flex-wrap gap-1 rounded-xl border border-white/5 bg-black/20 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-lg px-3 py-1.5 text-xs tracking-wide transition ${
              tab === t.id
                ? "bg-gold/15 text-gold-light"
                : "text-muted-foreground hover:text-foreground/80"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div>
        {tab === "wheel" && (
          <div className="space-y-4">
            <ChartWheel chart={chart} />
            <p className="text-center text-[11px] text-muted-foreground/70">
              Tropical zodiac · Placidus houses · Ascendant fixed to the left. Hard aspects
              solid, soft and minor aspects dashed.
            </p>
          </div>
        )}
        {tab === "dignities" && (
          <DignitiesTable dignities={analysis.dignities} almuten={analysis.ascendantAlmuten} />
        )}
        {tab === "aspects" && <Aspectarian chart={chart} />}
        {tab === "mortality" && <MortalityPanel analysis={analysis} />}
      </div>
    </div>
  );
}
