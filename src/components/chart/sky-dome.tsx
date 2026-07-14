import type { DeathChart } from "@/lib/types";
import { PLANET_GLYPH } from "@/lib/glyphs";
import { BRIGHT_STARS } from "@/lib/stars";
import {
  julianDay, lstDeg, eclipticAltAz, equatorialToAltAz,
} from "@/lib/skymath";

/**
 * The local sky at the moment of crossing: a zenith-centred projection of the
 * visible hemisphere. The horizon is the outer circle, the zenith the centre;
 * cardinal points ring the rim. The Sun, Moon, and planets are plotted where
 * they truly stood, the ecliptic traced behind them, and the brightest stars
 * scattered as they were seen. Requires a known time and place.
 */

const SIZE = 480;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R = SIZE / 2 - 26;

// Altitude → radius from centre (zenith at 0, horizon at R). Azimuth is measured
// clockwise from North; we place North at the top and mirror east/west so the
// map reads as if you were lying back and looking up.
function project(alt: number, az: number): { x: number; y: number } | null {
  if (alt < 0) return null; // below the horizon
  const rr = R * (1 - alt / 90);
  const a = (az - 90) * (Math.PI / 180); // rotate so N=up
  return { x: CX + rr * Math.cos(a), y: CY + rr * Math.sin(a) };
}

function starRadius(mag: number): number {
  return Math.max(0.5, 2.4 - mag * 0.6);
}

export function SkyDome({ chart }: { chart: DeathChart }) {
  if (!chart.locationKnown || chart.latitude == null || chart.longitude == null) {
    return (
      <p className="text-sm text-muted-foreground">
        The sky map needs a known time and place of death to know which way was up.
      </p>
    );
  }

  const jd = julianDay(chart.timestampUtc);
  const lst = lstDeg(jd, chart.longitude);
  const lat = chart.latitude;

  // Bright stars above the horizon.
  const stars = BRIGHT_STARS.map((s) => {
    const { alt, az } = equatorialToAltAz(s.ra, s.dec, lat, lst);
    const p = project(alt, az);
    return p ? { ...s, ...p } : null;
  }).filter(Boolean) as (typeof BRIGHT_STARS[number] & { x: number; y: number })[];

  // Ecliptic trace.
  const eclPts: string[] = [];
  for (let lon = 0; lon <= 360; lon += 3) {
    const { alt, az } = eclipticAltAz(lon, lat, lst);
    const p = project(alt, az);
    if (p) eclPts.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`);
  }

  // Bodies.
  const bodies = chart.planets.map((pl) => {
    const { alt, az } = eclipticAltAz(pl.longitude, lat, lst);
    const p = project(alt, az);
    return { name: pl.name, alt, az, p };
  });
  const visible = bodies.filter((b) => b.p);
  const below = bodies.filter((b) => !b.p);

  const cardinals: { label: string; az: number }[] = [
    { label: "N", az: 0 }, { label: "E", az: 90 }, { label: "S", az: 180 }, { label: "W", az: 270 },
  ];

  return (
    <div>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="mx-auto block h-auto w-full max-w-[480px]" role="img" aria-label="Sky at the moment of death">
        <defs>
          <radialGradient id="domeGround" cx="50%" cy="42%" r="60%">
            <stop offset="0%" stopColor="#161334" />
            <stop offset="70%" stopColor="#0d0b1f" />
            <stop offset="100%" stopColor="#080713" />
          </radialGradient>
        </defs>

        <circle cx={CX} cy={CY} r={R} fill="url(#domeGround)" stroke="#e9c46a" strokeOpacity={0.3} />
        {/* Altitude rings at 30° and 60° */}
        <circle cx={CX} cy={CY} r={R * (1 / 3)} fill="none" stroke="#a9b6d6" strokeOpacity={0.1} strokeWidth={0.6} />
        <circle cx={CX} cy={CY} r={R * (2 / 3)} fill="none" stroke="#a9b6d6" strokeOpacity={0.1} strokeWidth={0.6} />

        {/* Ecliptic */}
        {eclPts.length > 1 && (
          <polyline points={eclPts.join(" ")} fill="none" stroke="#e9c46a" strokeOpacity={0.28} strokeWidth={1} strokeDasharray="4 3" />
        )}

        {/* Stars */}
        {stars.map((s) => (
          <g key={s.name}>
            <circle cx={s.x} cy={s.y} r={starRadius(s.mag)} fill="#eaf0ff" fillOpacity={0.9} />
            {s.label && (
              <text x={s.x + 4} y={s.y - 3} fill="#c7cfe6" fillOpacity={0.7} fontSize={7}>{s.name}</text>
            )}
          </g>
        ))}

        {/* Bodies */}
        {visible.map((b) => (
          <g key={b.name}>
            {b.name === "Sun" && <circle cx={b.p!.x} cy={b.p!.y} r={11} fill="#f4d98c" fillOpacity={0.18} />}
            <text x={b.p!.x} y={b.p!.y} fill={b.name === "Sun" ? "#f6d879" : "#f4d98c"} fontSize={16} textAnchor="middle" dominantBaseline="central">
              {PLANET_GLYPH[b.name] ?? "✷"}
            </text>
          </g>
        ))}

        {/* Cardinal points */}
        {cardinals.map((c) => {
          const a = (c.az - 90) * (Math.PI / 180);
          const x = CX + (R + 13) * Math.cos(a);
          const y = CY + (R + 13) * Math.sin(a);
          return (
            <text key={c.label} x={x} y={y} fill="#e9c46a" fillOpacity={0.8} fontSize={11} fontWeight={600} textAnchor="middle" dominantBaseline="central">
              {c.label}
            </text>
          );
        })}
        <text x={CX} y={CY - 4} fill="#8a83a6" fontSize={8} textAnchor="middle">zenith</text>
      </svg>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="text-gold-light">☉</span> above the horizon</span>
        <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-[#eaf0ff]" /> bright star</span>
        <span className="flex items-center gap-1"><span className="inline-block h-px w-4 border-t border-dashed border-gold/50" /> ecliptic</span>
      </div>

      {below.length > 0 && (
        <p className="mt-2 text-center text-[11px] text-muted-foreground/70">
          Below the horizon at the crossing: {below.map((b) => b.name).join(", ")}.
        </p>
      )}
    </div>
  );
}
