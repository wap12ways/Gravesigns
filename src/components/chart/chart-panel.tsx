"use client";

import { useMemo, useState } from "react";
import type { DeathChart } from "@/lib/types";
import { computeChartAnalysis } from "@/lib/analysis";
import { computeCrossAspects } from "@/lib/analysis/synastry";
import { ELEMENT_COLOR, PLANET_GLYPH, ASPECT_COLOR } from "@/lib/glyphs";
import { ChartWheel } from "./chart-wheel";
import { DignitiesTable } from "./dignities-table";
import { Aspectarian } from "./aspectarian";
import { MortalityPanel } from "./mortality-panel";
import { MoonPhaseDisk } from "./moon-phase";
import { SkyDome } from "./sky-dome";

type Tab = "wheel" | "sky" | "dignities" | "aspects" | "mortality" | "return";

export function ChartPanel({ chart, natalChart }: { chart: DeathChart; natalChart?: DeathChart | null }) {
  const hasNatal = !!natalChart;
  const hasSky = chart.locationKnown && chart.latitude != null && chart.longitude != null;
  const TABS: { id: Tab; label: string }[] = [
    { id: "wheel", label: "The Wheel" },
    ...(hasSky ? [{ id: "sky" as Tab, label: "The Sky" }] : []),
    { id: "dignities", label: "Dignities" },
    { id: "aspects", label: "Aspects" },
    { id: "mortality", label: "Mortality" },
    ...(hasNatal ? [{ id: "return" as Tab, label: "Life & Return" }] : []),
  ];
  const [tab, setTab] = useState<Tab>("wheel");
  const analysis = useMemo(() => computeChartAnalysis(chart), [chart]);
  const cross = useMemo(
    () => (natalChart ? computeCrossAspects(natalChart, chart) : []),
    [natalChart, chart]
  );

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
        {tab === "sky" && (
          <div className="space-y-2">
            <SkyDome chart={chart} />
            <p className="text-center text-[11px] text-muted-foreground/70">
              The visible hemisphere at the moment of crossing — zenith at the centre,
              horizon at the rim, looking upward.
            </p>
          </div>
        )}
        {tab === "dignities" && (
          <DignitiesTable dignities={analysis.dignities} almuten={analysis.ascendantAlmuten} />
        )}
        {tab === "aspects" && <Aspectarian chart={chart} />}
        {tab === "mortality" && <MortalityPanel analysis={analysis} />}
        {tab === "return" && natalChart && (
          <div className="space-y-5">
            <ChartWheel chart={natalChart} transits={chart} transitLabel="pale glyphs — the sky at the crossing" />
            <p className="text-center text-[11px] text-muted-foreground/70">
              The bi-wheel: the nativity within, the death-moment sky (pale) returning over it.
            </p>
            <div>
              <div className="mb-2 text-[10px] uppercase tracking-[0.16em] text-gold/70">
                The Return — cross-aspects at the crossing
              </div>
              {cross.length ? (
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {cross.slice(0, 12).map((c, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg border border-white/5 bg-black/20 px-3 py-1.5 text-xs">
                      <span className="text-gold-light">{PLANET_GLYPH[c.transit] ?? c.transit}</span>
                      <span style={{ color: ASPECT_COLOR[c.aspect] ?? "#8a83a6" }}>{c.aspect}</span>
                      <span className="text-foreground/70">natal {PLANET_GLYPH[c.natal] ?? c.natal}</span>
                      <span className="ml-auto text-muted-foreground/60">{c.orb}°{c.weighty ? " ★" : ""}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No tight cross-aspects.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
