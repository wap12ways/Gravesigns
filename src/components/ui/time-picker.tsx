"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { PopoverPanel } from "./popover-panel";

interface TimePickerProps {
  value: string; // HH:MM (24h)
  onChange: (v: string) => void;
  id?: string;
  placeholder?: string;
}

function parse(v: string): { h12: number; m: number; ap: "AM" | "PM" } | null {
  if (!/^\d{1,2}:\d{2}$/.test(v)) return null;
  const [h, m] = v.split(":").map(Number);
  return { h12: h % 12 || 12, m, ap: h < 12 ? "AM" : "PM" };
}
function to24(h12: number, ap: "AM" | "PM"): number {
  return (h12 % 12) + (ap === "PM" ? 12 : 0);
}
function label(v: string): string {
  const p = parse(v);
  return p ? `${p.h12}:${String(p.m).padStart(2, "0")} ${p.ap}` : "";
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

export function TimePicker({
  value,
  onChange,
  id,
  placeholder = "Add a time",
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const bodyRef = React.useRef<HTMLDivElement>(null);

  const current = parse(value) ?? { h12: 12, m: 0, ap: "PM" as const };

  const emit = (h12: number, m: number, ap: "AM" | "PM") => {
    const h = to24(h12, ap);
    onChange(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  };

  React.useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      bodyRef.current
        ?.querySelectorAll<HTMLElement>("[data-selected='true']")
        .forEach((el) => el.scrollIntoView({ block: "center" }));
    });
  }, [open]);

  const Col = ({
    items,
    selected,
    onPick,
    fmt,
  }: {
    items: number[];
    selected: number;
    onPick: (n: number) => void;
    fmt?: (n: number) => string;
  }) => (
    <div className="max-h-56 flex-1 overflow-y-auto px-1 py-1 [scrollbar-width:none]">
      {items.map((n) => {
        const isSel = n === selected;
        return (
          <button
            key={n}
            type="button"
            data-selected={isSel}
            onClick={() => onPick(n)}
            className={cn(
              "mb-0.5 flex w-full items-center justify-center rounded-lg py-1.5 text-sm transition-colors",
              isSel
                ? "bg-gold/15 font-medium text-gold-light"
                : "text-foreground/75 hover:bg-white/5"
            )}
          >
            {fmt ? fmt(n) : n}
          </button>
        );
      })}
    </div>
  );

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
        <Clock className="h-4 w-4 shrink-0 text-muted-foreground/60" />
        <span className={cn(value ? "text-foreground" : "text-muted-foreground/70")}>
          {value ? label(value) : placeholder}
        </span>
      </button>

      <PopoverPanel anchorRef={triggerRef} open={open} onClose={() => setOpen(false)}>
        <div ref={bodyRef} className="flex gap-1 p-2">
          <Col
            items={HOURS}
            selected={current.h12}
            onPick={(h) => emit(h, current.m, current.ap)}
          />
          <Col
            items={MINUTES}
            selected={current.m}
            fmt={(n) => String(n).padStart(2, "0")}
            onPick={(m) => emit(current.h12, m, current.ap)}
          />
          <div className="flex flex-col gap-1 px-1 py-1">
            {(["AM", "PM"] as const).map((ap) => (
              <button
                key={ap}
                type="button"
                onClick={() => emit(current.h12, current.m, ap)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm transition-colors",
                  current.ap === ap
                    ? "bg-gold/15 font-medium text-gold-light"
                    : "text-foreground/75 hover:bg-white/5"
                )}
              >
                {ap}
              </button>
            ))}
          </div>
        </div>
      </PopoverPanel>
    </>
  );
}
