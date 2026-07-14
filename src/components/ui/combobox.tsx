"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { PopoverPanel } from "./popover-panel";

export interface ComboOption {
  value: string;
  label: string;
  /** Small trailing hint, e.g. a GMT offset */
  hint?: string;
  /** Optional leading glyph/emoji */
  icon?: React.ReactNode;
}

interface ComboboxProps {
  value: string;
  options: ComboOption[];
  onSelect: (value: string, option: ComboOption) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  ariaLabel?: string;
}

/** A luxurious searchable single-select combobox. */
export function Combobox({
  value,
  options,
  onSelect,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyText = "No matches",
  ariaLabel,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.value.toLowerCase().includes(q) ||
        o.hint?.toLowerCase().includes(q)
    );
  }, [options, query]);

  React.useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      // focus the search box once the panel is painted
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open]);

  React.useEffect(() => {
    setActive(0);
  }, [query]);

  // keep the active item scrolled into view
  React.useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-idx="${active}"]`
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [active, open, filtered]);

  const choose = (opt: ComboOption) => {
    onSelect(opt.value, opt);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = filtered[active];
      if (opt) choose(opt);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-input bg-black/20 px-4 py-2 text-left text-sm transition-colors hover:border-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:border-gold/40",
          open && "border-gold/40 ring-2 ring-ring/40"
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          {selected?.icon}
          <span
            className={cn(
              "truncate",
              selected ? "text-foreground" : "text-muted-foreground/70"
            )}
          >
            {selected ? selected.label : placeholder}
          </span>
        </span>
        <span className="flex items-center gap-2">
          {selected?.hint && (
            <span className="shrink-0 rounded-md bg-gold/10 px-1.5 py-0.5 text-[11px] font-medium text-gold-light">
              {selected.hint}
            </span>
          )}
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground/70" />
        </span>
      </button>

      <PopoverPanel anchorRef={triggerRef} open={open} onClose={() => setOpen(false)}>
        <div onKeyDown={onKeyDown}>
          <div className="flex items-center gap-2 border-b border-white/10 px-3">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground/70" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-11 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
            />
          </div>
          <div
            ref={listRef}
            role="listbox"
            className="max-h-72 overflow-y-auto p-1.5"
          >
            {filtered.length === 0 && (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                {emptyText}
              </div>
            )}
            {filtered.map((opt, i) => {
              const isSel = opt.value === value;
              return (
                <button
                  key={opt.value || "__auto__"}
                  type="button"
                  data-idx={i}
                  role="option"
                  aria-selected={isSel}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(opt)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    i === active ? "bg-gold/10 text-gold-light" : "text-foreground/85"
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    {opt.icon}
                    <span className="truncate">{opt.label}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    {opt.hint && (
                      <span className="text-[11px] text-muted-foreground">
                        {opt.hint}
                      </span>
                    )}
                    {isSel && <Check className="h-4 w-4 text-gold-light" />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </PopoverPanel>
    </>
  );
}
