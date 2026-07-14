"use client";

import * as React from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { PopoverPanel } from "./popover-panel";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function parse(v: string): { y: number; m: number; d: number } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const [y, m, d] = v.split("-").map(Number);
  return { y, m: m - 1, d };
}
function toYMD(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
function label(v: string): string {
  const p = parse(v);
  if (!p) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(p.y, p.m, p.d));
}

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (v: string) => void;
  id?: string;
  placeholder?: string;
}

export function DatePicker({
  value,
  onChange,
  id,
  placeholder = "Select a date",
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState<"days" | "years">("days");
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  const max = React.useMemo(() => {
    const t = new Date();
    t.setHours(23, 59, 59, 999);
    return t;
  }, []);

  const parsed = parse(value);
  const [view, setView] = React.useState(() => {
    const base = parsed ? new Date(parsed.y, parsed.m, 1) : new Date();
    return { y: base.getFullYear(), m: base.getMonth() };
  });

  React.useEffect(() => {
    if (open) {
      setMode("days");
      const base = parsed ? new Date(parsed.y, parsed.m, 1) : new Date();
      setView({ y: base.getFullYear(), m: base.getMonth() });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const shiftMonth = (delta: number) => {
    setView((v) => {
      const d = new Date(v.y, v.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  };

  const firstDow = new Date(view.y, view.m, 1).getDay();
  const daysIn = new Date(view.y, view.m + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysIn }, (_, i) => i + 1),
  ];

  const choose = (day: number) => {
    onChange(toYMD(view.y, view.m, day));
    setOpen(false);
    triggerRef.current?.focus();
  };

  const years: number[] = [];
  for (let y = max.getFullYear(); y >= 1900; y--) years.push(y);

  return (
    <>
      <button
        id={id}
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-11 w-full items-center gap-2.5 rounded-xl border border-input bg-black/20 px-4 py-2 text-left text-sm transition-colors hover:border-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:border-gold/40",
          open && "border-gold/40 ring-2 ring-ring/40"
        )}
      >
        <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground/60" />
        <span className={cn(value ? "text-foreground" : "text-muted-foreground/70")}>
          {value ? label(value) : placeholder}
        </span>
      </button>

      <PopoverPanel anchorRef={triggerRef} open={open} onClose={() => setOpen(false)}>
        <div className="p-3">
          <div className="mb-2 flex items-center justify-between">
            {mode === "days" ? (
              <>
                <IconBtn onClick={() => shiftMonth(-1)} aria-label="Previous month">
                  <ChevronLeft className="h-4 w-4" />
                </IconBtn>
                <button
                  type="button"
                  onClick={() => setMode("years")}
                  className="rounded-lg px-2 py-1 text-sm font-medium text-foreground/90 transition-colors hover:text-gold-light"
                >
                  {MONTHS[view.m]} {view.y}
                </button>
                <IconBtn onClick={() => shiftMonth(1)} aria-label="Next month">
                  <ChevronRight className="h-4 w-4" />
                </IconBtn>
              </>
            ) : (
              <span className="px-2 py-1 text-sm font-medium text-foreground/90">
                Select a year
              </span>
            )}
          </div>

          {mode === "days" ? (
            <>
              <div className="grid grid-cols-7 text-center text-[10px] uppercase tracking-wider text-muted-foreground/60">
                {WEEKDAYS.map((w, i) => (
                  <div key={i} className="py-1">
                    {w}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {cells.map((day, i) => {
                  if (day === null) return <div key={i} />;
                  const isSel =
                    parsed &&
                    parsed.y === view.y &&
                    parsed.m === view.m &&
                    parsed.d === day;
                  const disabled = new Date(view.y, view.m, day) > max;
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={disabled}
                      onClick={() => choose(day)}
                      className={cn(
                        "flex h-9 items-center justify-center rounded-lg text-sm transition-colors",
                        isSel
                          ? "bg-gradient-to-b from-gold-light to-gold-deep font-semibold text-primary-foreground"
                          : "text-foreground/85 hover:bg-gold/10 hover:text-gold-light",
                        disabled && "pointer-events-none text-muted-foreground/25"
                      )}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="grid max-h-64 grid-cols-4 gap-1 overflow-y-auto p-0.5">
              {years.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => {
                    setView((v) => ({ ...v, y }));
                    setMode("days");
                  }}
                  className={cn(
                    "rounded-lg py-2 text-sm transition-colors",
                    y === view.y
                      ? "bg-gold/15 text-gold-light"
                      : "text-foreground/80 hover:bg-white/5"
                  )}
                >
                  {y}
                </button>
              ))}
            </div>
          )}
        </div>
      </PopoverPanel>
    </>
  );
}

function IconBtn({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/80 transition-colors hover:bg-white/5 hover:text-gold-light"
      {...props}
    >
      {children}
    </button>
  );
}
