"use client";

import * as React from "react";
import { MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PopoverPanel } from "./ui/popover-panel";

interface PlaceHit {
  id: number;
  label: string;
  lat: number;
  lon: number;
  country?: string;
}

interface PlaceAutocompleteProps {
  value: string;
  /** Free-text edit — coordinates are cleared by the parent */
  onChange: (text: string) => void;
  /** A suggestion was chosen — carries resolved coordinates */
  onResolve: (place: string, lat: number, lon: number) => void;
  placeholder?: string;
  id?: string;
}

/**
 * A place field with live city suggestions (keyless Open-Meteo geocoding).
 * Choosing a suggestion captures exact coordinates — which pin the chart's
 * houses precisely — while free text still works as a graceful fallback.
 */
export function PlaceAutocomplete({
  value,
  onChange,
  onResolve,
  placeholder,
  id,
}: PlaceAutocompleteProps) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<PlaceHit[]>([]);
  const [active, setActive] = React.useState(0);
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const skipNext = React.useRef(false);

  React.useEffect(() => {
    if (skipNext.current) {
      skipNext.current = false;
      return;
    }
    const q = value.trim();
    if (q.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    setOpen(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
            q
          )}&count=6&language=en&format=json`,
          { signal: ctrl.signal }
        );
        const data = await res.json();
        const hits: PlaceHit[] = (data?.results ?? []).map(
          (r: {
            id: number;
            name: string;
            admin1?: string;
            country?: string;
            latitude: number;
            longitude: number;
          }) => ({
            id: r.id,
            label: [r.name, r.admin1, r.country].filter(Boolean).join(", "),
            country: r.country,
            lat: r.latitude,
            lon: r.longitude,
          })
        );
        setResults(hits);
        setActive(0);
      } catch {
        // aborted or offline — leave prior results
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [value]);

  const choose = (hit: PlaceHit) => {
    skipNext.current = true;
    onResolve(hit.label, hit.lat, hit.lon);
    setOpen(false);
    setResults([]);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const hit = results[active];
      if (hit) choose(hit);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => {
            if (results.length) setOpen(true);
          }}
          placeholder={placeholder}
          autoComplete="off"
          className="flex h-11 w-full rounded-xl border border-input bg-black/20 pl-10 pr-4 py-2 text-sm text-foreground ring-offset-background transition-colors placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:border-gold/40"
        />
        {loading && (
          <Loader2 className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gold/70" />
        )}
      </div>

      <PopoverPanel
        anchorRef={wrapRef}
        open={open}
        onClose={() => setOpen(false)}
      >
        <div className="max-h-72 overflow-y-auto p-1.5">
          {loading && results.length === 0 && (
            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
              Searching…
            </div>
          )}
          {!loading && results.length === 0 && (
            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
              No places found — you can type it freely instead.
            </div>
          )}
          {results.map((hit, i) => (
            <button
              key={hit.id}
              type="button"
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(hit)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                i === active ? "bg-gold/10 text-gold-light" : "text-foreground/85"
              )}
            >
              <MapPin className="h-4 w-4 shrink-0 text-gold/60" />
              <span className="truncate">{hit.label}</span>
            </button>
          ))}
        </div>
      </PopoverPanel>
    </div>
  );
}
