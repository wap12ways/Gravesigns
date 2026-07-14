import type { DeathChart } from "@/lib/types";
import {
  PLANET_GLYPH, SIGN_GLYPH, SIGN_ELEMENT, ELEMENT_COLOR,
  ASPECT_COLOR, ASPECT_HARD, SIGNS_ORDER,
} from "@/lib/glyphs";

/**
 * A traditional square-cornered round chart wheel drawn from the death chart.
 * One transform governs the whole diagram: with the Ascendant fixed at the left
 * (9 o'clock), a longitude λ maps to screen angle θ = 180 + (λ − ref), and every
 * ring — zodiac, unequal Placidus house spokes, planets, aspect lines — is placed
 * with x = cx + R·cos θ, y = cy − R·sin θ. When no houses are known, the zodiac is
 * fixed with 0° Aries at the left instead.
 */

const SIZE = 480;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R = SIZE / 2 - 6;

const r = {
  zodiacOuter: R,
  zodiacInner: R - 30,
  houseRing: R - 30,
  houseInner: R - 54,
  planet: R - 74,
  tickOuter: R - 30,
  tickInner: R - 62,
  aspectHub: R - 96,
};

function toXY(lonDeg: number, ref: number, radius: number) {
  const theta = ((180 + (lonDeg - ref)) * Math.PI) / 180;
  return { x: CX + radius * Math.cos(theta), y: CY - radius * Math.sin(theta) };
}

interface Placed {
  name: string;
  lon: number;
  drawLon: number; // possibly nudged to avoid glyph collisions
}

/** Spread glyphs that sit within `minSep` degrees of each other. */
function despread(items: { name: string; lon: number }[], ref: number): Placed[] {
  const minSep = 7;
  const sorted = items
    .map((it) => ({ ...it, drawLon: it.lon }))
    .sort((a, b) => ((a.lon - ref + 360) % 360) - ((b.lon - ref + 360) % 360));
  for (let iter = 0; iter < 60; iter++) {
    let moved = false;
    for (let i = 0; i < sorted.length; i++) {
      const a = sorted[i];
      const b = sorted[(i + 1) % sorted.length];
      let gap = ((b.drawLon - a.drawLon + 360) % 360);
      if (gap > 180) gap -= 360;
      if (Math.abs(gap) < minSep) {
        const push = (minSep - Math.abs(gap)) / 2 + 0.01;
        a.drawLon -= push;
        b.drawLon += push;
        moved = true;
      }
    }
    if (!moved) break;
  }
  return sorted;
}

export function ChartWheel({
  chart,
  transits,
  transitLabel,
}: {
  chart: DeathChart;
  /** Optional second chart drawn as an inner ring (e.g. the death sky over a nativity) */
  transits?: DeathChart | null;
  transitLabel?: string;
}) {
  const hasHouses = chart.houseCusps.length >= 13 && chart.ascendantLon != null;
  const ref = chart.ascendantLon ?? 0;

  const placed = despread(
    chart.planets.map((p) => ({ name: p.name, lon: p.longitude })),
    ref
  );
  const lonByName = new Map(chart.planets.map((p) => [p.name, p.longitude]));

  const rTransit = R - 120;
  const placedTransits = transits
    ? despread(transits.planets.map((p) => ({ name: p.name, lon: p.longitude })), ref)
    : [];
  const transitLonByName = new Map((transits?.planets ?? []).map((p) => [p.name, p.longitude]));

  // Sign sectors
  const signSectors = SIGNS_ORDER.map((sign, i) => {
    const start = i * 30;
    const p0o = toXY(start, ref, r.zodiacOuter);
    const p0i = toXY(start, ref, r.zodiacInner);
    const mid = toXY(start + 15, ref, (r.zodiacOuter + r.zodiacInner) / 2);
    const el = SIGN_ELEMENT[sign];
    // Arc path for the sign band fill
    const a0 = toXY(start, ref, r.zodiacOuter);
    const a1 = toXY(start + 30, ref, r.zodiacOuter);
    const b1 = toXY(start + 30, ref, r.zodiacInner);
    const b0 = toXY(start, ref, r.zodiacInner);
    const path = `M ${a0.x} ${a0.y} A ${r.zodiacOuter} ${r.zodiacOuter} 0 0 0 ${a1.x} ${a1.y} L ${b1.x} ${b1.y} A ${r.zodiacInner} ${r.zodiacInner} 0 0 1 ${b0.x} ${b0.y} Z`;
    return { sign, el, path, p0o, p0i, mid };
  });

  // House cusps
  const houseSpokes: { h: number; angular: boolean; from: { x: number; y: number }; to: { x: number; y: number }; num: { x: number; y: number } }[] = [];
  if (hasHouses) {
    for (let h = 1; h <= 12; h++) {
      const cusp = chart.houseCusps[h];
      const angular = h === 1 || h === 4 || h === 7 || h === 10;
      const from = toXY(cusp, ref, r.aspectHub);
      const to = toXY(cusp, ref, r.zodiacInner);
      // number sits at mid-house
      const next = chart.houseCusps[h === 12 ? 1 : h + 1];
      let span = (next - cusp + 360) % 360;
      if (span === 0) span = 30;
      const num = toXY(cusp + span / 2, ref, r.houseInner - 6);
      houseSpokes.push({ h, angular, from, to, num });
    }
  }

  // Aspect lines
  const aspectLines = chart.aspects
    .map((a, i) => {
      const la = lonByName.get(a.a);
      const lb = lonByName.get(a.b);
      if (la == null || lb == null) return null;
      const pa = toXY(la, ref, r.aspectHub);
      const pb = toXY(lb, ref, r.aspectHub);
      return {
        key: i,
        pa, pb,
        color: ASPECT_COLOR[a.type] ?? "#8a83a6",
        hard: ASPECT_HARD.has(a.type),
        tight: a.orb <= 2,
      };
    })
    .filter(Boolean) as { key: number; pa: { x: number; y: number }; pb: { x: number; y: number }; color: string; hard: boolean; tight: boolean }[];

  const degIn = (lon: number) => lon - Math.floor(lon / 30) * 30;

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="mx-auto block h-auto w-full max-w-[480px]"
      role="img"
      aria-label="Death chart wheel"
    >
      <defs>
        <radialGradient id="wheelGround" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#141225" />
          <stop offset="100%" stopColor="#0b0a17" />
        </radialGradient>
      </defs>

      <circle cx={CX} cy={CY} r={r.zodiacOuter} fill="url(#wheelGround)" />

      {/* Sign band */}
      {signSectors.map((s) => (
        <g key={s.sign}>
          <path d={s.path} fill={ELEMENT_COLOR[s.el]} fillOpacity={0.08} />
          <line x1={s.p0o.x} y1={s.p0o.y} x2={s.p0i.x} y2={s.p0i.y} stroke="#e9c46a" strokeOpacity={0.18} strokeWidth={0.6} />
          <text
            x={s.mid.x} y={s.mid.y}
            fill={ELEMENT_COLOR[s.el]} fillOpacity={0.9}
            fontSize={15} textAnchor="middle" dominantBaseline="central"
          >
            {SIGN_GLYPH[s.sign]}
          </text>
        </g>
      ))}

      <circle cx={CX} cy={CY} r={r.zodiacOuter} fill="none" stroke="#e9c46a" strokeOpacity={0.35} strokeWidth={1} />
      <circle cx={CX} cy={CY} r={r.zodiacInner} fill="none" stroke="#e9c46a" strokeOpacity={0.22} strokeWidth={0.8} />
      <circle cx={CX} cy={CY} r={r.aspectHub} fill="none" stroke="#e9c46a" strokeOpacity={0.12} strokeWidth={0.6} />

      {/* Degree ticks every 5° / 1° */}
      {Array.from({ length: 360 }, (_, d) => {
        const major = d % 30 === 0;
        const five = d % 5 === 0;
        if (!five) return null;
        const outer = toXY(d, ref, r.zodiacInner);
        const inner = toXY(d, ref, r.zodiacInner - (major ? 8 : five ? 4 : 2));
        return <line key={d} x1={outer.x} y1={outer.y} x2={inner.x} y2={inner.y} stroke="#e9c46a" strokeOpacity={major ? 0.3 : 0.15} strokeWidth={0.5} />;
      })}

      {/* House spokes + numbers */}
      {houseSpokes.map((h) => (
        <g key={h.h}>
          <line
            x1={h.from.x} y1={h.from.y} x2={h.to.x} y2={h.to.y}
            stroke={h.angular ? "#f4d98c" : "#a9b6d6"}
            strokeOpacity={h.angular ? 0.55 : 0.18}
            strokeWidth={h.angular ? 1.4 : 0.6}
          />
          <text x={h.num.x} y={h.num.y} fill="#8a83a6" fontSize={9} textAnchor="middle" dominantBaseline="central">
            {h.h}
          </text>
        </g>
      ))}

      {/* Angle labels (AC / MC / DC / IC) */}
      {hasHouses && (
        <>
          <AngleLabel lon={chart.houseCusps[1]} ref={ref} label="AC" />
          <AngleLabel lon={chart.houseCusps[10]} ref={ref} label="MC" />
          <AngleLabel lon={chart.houseCusps[7]} ref={ref} label="DC" />
          <AngleLabel lon={chart.houseCusps[4]} ref={ref} label="IC" />
        </>
      )}

      {/* Aspect lines */}
      {aspectLines.map((a) => (
        <line
          key={a.key}
          x1={a.pa.x} y1={a.pa.y} x2={a.pb.x} y2={a.pb.y}
          stroke={a.color}
          strokeOpacity={a.tight ? 0.7 : 0.4}
          strokeWidth={a.tight ? 1.3 : 0.8}
          strokeDasharray={a.hard ? undefined : "3 3"}
        />
      ))}

      {/* Planets */}
      {placed.map((p) => {
        const realLon = lonByName.get(p.name)!;
        const tickO = toXY(realLon, ref, r.tickOuter);
        const tickI = toXY(p.drawLon, ref, r.tickInner);
        const glyphPos = toXY(p.drawLon, ref, r.planet);
        const degPos = toXY(p.drawLon, ref, r.planet - 15);
        const retro = chart.planets.find((x) => x.name === p.name)?.retrograde;
        return (
          <g key={p.name}>
            <line x1={tickO.x} y1={tickO.y} x2={tickI.x} y2={tickI.y} stroke="#e9c46a" strokeOpacity={0.3} strokeWidth={0.6} />
            <text x={glyphPos.x} y={glyphPos.y} fill="#f4d98c" fontSize={17} textAnchor="middle" dominantBaseline="central">
              {PLANET_GLYPH[p.name] ?? "✷"}
            </text>
            <text x={degPos.x} y={degPos.y} fill="#c9c4d6" fillOpacity={0.75} fontSize={7.5} textAnchor="middle" dominantBaseline="central">
              {Math.floor(degIn(realLon))}°{retro ? "℞" : ""}
            </text>
          </g>
        );
      })}

      {/* Transit ring (the death sky over a nativity) */}
      {transits && (
        <>
          <circle cx={CX} cy={CY} r={rTransit + 14} fill="none" stroke="#a9b6d6" strokeOpacity={0.15} strokeWidth={0.6} strokeDasharray="2 3" />
          {placedTransits.map((p) => {
            const realLon = transitLonByName.get(p.name)!;
            const tickO = toXY(realLon, ref, rTransit + 14);
            const tickI = toXY(p.drawLon, ref, rTransit + 6);
            const glyphPos = toXY(p.drawLon, ref, rTransit);
            return (
              <g key={`t-${p.name}`}>
                <line x1={tickO.x} y1={tickO.y} x2={tickI.x} y2={tickI.y} stroke="#a9b6d6" strokeOpacity={0.3} strokeWidth={0.6} />
                <text x={glyphPos.x} y={glyphPos.y} fill="#c7cfe6" fontSize={13} textAnchor="middle" dominantBaseline="central">
                  {PLANET_GLYPH[p.name] ?? "✷"}
                </text>
              </g>
            );
          })}
        </>
      )}

      {transits && transitLabel && (
        <text x={CX} y={CY + 14} fill="#a9b6d6" fillOpacity={0.7} fontSize={8} textAnchor="middle">
          {transitLabel}
        </text>
      )}

      <circle cx={CX} cy={CY} r={2} fill="#e9c46a" fillOpacity={0.5} />
    </svg>
  );
}

function AngleLabel({ lon, ref, label }: { lon: number; ref: number; label: string }) {
  const pos = toXY(lon, ref, r.houseInner - 2);
  return (
    <g>
      <circle cx={pos.x} cy={pos.y} r={9} fill="#0b0a17" fillOpacity={0.85} stroke="#f4d98c" strokeOpacity={0.35} strokeWidth={0.6} />
      <text x={pos.x} y={pos.y} fill="#f4d98c" fontSize={8.5} fontWeight={600} textAnchor="middle" dominantBaseline="central" letterSpacing="0.03em">
        {label}
      </text>
    </g>
  );
}
