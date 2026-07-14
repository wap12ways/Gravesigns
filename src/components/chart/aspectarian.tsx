import type { DeathChart } from "@/lib/types";
import { PLANET_GLYPH, ASPECT_COLOR } from "@/lib/glyphs";

const ASPECT_GLYPH: Record<string, string> = {
  Conjunction: "☌", Opposition: "☍", Square: "□", Trine: "△",
  Sextile: "✶", Quincunx: "⚻", Semisextile: "⚺",
};

/** The classic lower-triangular aspect grid ("aspectarian"). */
export function Aspectarian({ chart }: { chart: DeathChart }) {
  const names = chart.planets.map((p) => p.name);
  const cell = new Map<string, { type: string; orb: number }>();
  for (const a of chart.aspects) cell.set(`${a.a}|${a.b}`, { type: a.type, orb: a.orb });
  const look = (x: string, y: string) => cell.get(`${x}|${y}`) ?? cell.get(`${y}|${x}`);

  return (
    <div className="overflow-x-auto">
      <table className="border-collapse">
        <tbody>
          {names.map((row, ri) => (
            <tr key={row}>
              <th className="px-1 py-0.5 text-right text-gold-light" title={row}>
                <span className="text-base">{PLANET_GLYPH[row] ?? row[0]}</span>
              </th>
              {names.slice(0, ri).map((col) => {
                const a = look(row, col);
                return (
                  <td
                    key={col}
                    className="h-7 w-7 border border-white/5 text-center align-middle"
                    title={a ? `${row} ${a.type} ${col} · ${a.orb.toFixed(1)}°` : undefined}
                  >
                    {a ? (
                      <span style={{ color: ASPECT_COLOR[a.type] ?? "#8a83a6" }} className="text-sm">
                        {ASPECT_GLYPH[a.type] ?? "•"}
                      </span>
                    ) : null}
                  </td>
                );
              })}
              <td className="h-7 w-7 text-center align-middle text-gold/50">
                <span className="text-base">{PLANET_GLYPH[row] ?? row[0]}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        {Object.entries(ASPECT_GLYPH).map(([type, g]) => (
          <span key={type} className="flex items-center gap-1">
            <span style={{ color: ASPECT_COLOR[type] }}>{g}</span> {type}
          </span>
        ))}
      </div>
    </div>
  );
}
