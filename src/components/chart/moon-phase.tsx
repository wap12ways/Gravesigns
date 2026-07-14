import type { DeathChart } from "@/lib/types";

/**
 * A small moon-phase disk drawn from the elongation of the Moon from the Sun.
 * The terminator is rendered as a half-ellipse whose width tracks illumination,
 * which side is lit tracks waxing vs waning.
 */
export function MoonPhaseDisk({ chart }: { chart: DeathChart }) {
  const sun = chart.planets.find((p) => p.name === "Sun");
  const moon = chart.planets.find((p) => p.name === "Moon");
  const R = 34;
  const cx = 40;
  const cy = 40;

  let illum = 0.5;
  let waxing = true;
  if (sun && moon) {
    const elong = (((moon.longitude - sun.longitude) % 360) + 360) % 360;
    illum = (1 - Math.cos((elong * Math.PI) / 180)) / 2; // 0 new → 1 full
    waxing = elong < 180;
  }

  // Terminator ellipse x-radius: 0 at quarter, R at new/full.
  const k = Math.abs(1 - 2 * illum); // 1 at new/full, 0 at quarters
  const ex = R * k;
  const crescent = illum < 0.5;
  // Lit side: waxing lights the right, waning the left.
  const litRight = waxing;

  // Build the lit-region path.
  const top = `${cx} ${cy - R}`;
  const bot = `${cx} ${cy + R}`;
  const outerSweep = litRight ? 1 : 0;
  // Half of the disk on the lit side (semicircle), then the terminator ellipse back.
  const semi = `M ${top} A ${R} ${R} 0 0 ${outerSweep} ${bot}`;
  const termSweep = crescent ? outerSweep : 1 - outerSweep;
  const term = `A ${ex} ${R} 0 0 ${termSweep} ${top}`;
  const litPath = `${semi} ${term} Z`;

  return (
    <div className="flex items-center gap-3">
      <svg viewBox="0 0 80 80" className="h-16 w-16">
        <defs>
          <radialGradient id="moonLit" cx="42%" cy="38%" r="65%">
            <stop offset="0%" stopColor="#f6ecc9" />
            <stop offset="100%" stopColor="#d9c98f" />
          </radialGradient>
        </defs>
        <circle cx={cx} cy={cy} r={R} fill="#15132a" stroke="#e9c46a" strokeOpacity={0.25} />
        <path d={litPath} fill="url(#moonLit)" />
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="#e9c46a" strokeOpacity={0.3} strokeWidth={0.8} />
      </svg>
      <div>
        <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Moon Phase</div>
        <div className="text-gold-light">{chart.moonPhase}</div>
        <div className="text-xs text-muted-foreground">{Math.round(illum * 100)}% illuminated</div>
      </div>
    </div>
  );
}
