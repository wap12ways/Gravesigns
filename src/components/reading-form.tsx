"use client";

import { useRef, useState } from "react";
import { Sparkles, Loader2, User, PawPrint } from "lucide-react";
import type { ReadingResponse, SubjectType } from "@/lib/types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Card, CardContent } from "./ui/card";
import { ReadingDisplay } from "./reading-display";
import { cn } from "@/lib/utils";

const LOADING_LINES = [
  "Casting the sky for the moment of crossing…",
  "Placing the Moon, the soul's quiet vehicle…",
  "Reading Saturn and Pluto at the threshold…",
  "Tracing the aspects into a single pattern…",
  "Composing the reading with care…",
];

export function ReadingForm() {
  const [type, setType] = useState<SubjectType>("human");
  const [fullName, setFullName] = useState("");
  const [dateOfDeath, setDateOfDeath] = useState("");
  const [timeOfDeath, setTimeOfDeath] = useState("");
  const [place, setPlace] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingLine, setLoadingLine] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReadingResponse | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError("Please enter the name of the one who has passed.");
      return;
    }
    if (!dateOfDeath) {
      setError("A date of death is needed to cast the chart.");
      return;
    }

    setResult(null);
    setLoading(true);
    setLoadingLine(0);
    intervalRef.current = setInterval(() => {
      setLoadingLine((n) => (n + 1) % LOADING_LINES.length);
    }, 2600);

    try {
      const res = await fetch("/api/readings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          dateOfDeath,
          timeOfDeath: timeOfDeath || null,
          place: place.trim() || null,
          type,
          notes: notes.trim() || null,
        }),
      });

      const body = await res.json();
      if (!res.ok) {
        throw new Error(body?.error || "Something went wrong casting the chart.");
      }
      setResult(body as ReadingResponse);
      requestAnimationFrame(() =>
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }

  return (
    <div className="space-y-8">
      <Card className="overflow-hidden">
        <div className="h-1 gold-hairline" />
        <CardContent className="pt-8">
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Subject type */}
            <div className="space-y-2">
              <Label>Who has crossed?</Label>
              <div className="grid grid-cols-2 gap-2">
                <TypeToggle
                  active={type === "human"}
                  onClick={() => setType("human")}
                  icon={<User className="h-4 w-4" />}
                  label="A Person"
                />
                <TypeToggle
                  active={type === "pet"}
                  onClick={() => setType("pet")}
                  icon={<PawPrint className="h-4 w-4" />}
                  label="A Pet"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Full name of the deceased</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={type === "pet" ? "e.g. Willow" : "e.g. Eleanor Hart"}
                autoComplete="off"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dateOfDeath">
                  Date of death <span className="text-gold/70">*</span>
                </Label>
                <Input
                  id="dateOfDeath"
                  type="date"
                  value={dateOfDeath}
                  onChange={(e) => setDateOfDeath(e.target.value)}
                  max={new Date().toISOString().slice(0, 10)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeOfDeath">Time of death (optional)</Label>
                <Input
                  id="timeOfDeath"
                  type="time"
                  value={timeOfDeath}
                  onChange={(e) => setTimeOfDeath(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="place">Place of death (optional)</Label>
              <Input
                id="place"
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                placeholder="City, Country"
                autoComplete="off"
              />
              <p className="text-[11px] text-muted-foreground/70">
                A place and time together unlock the houses and rising sign.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">
                Personality, culture, or special notes (optional)
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything you'd like honored — their spirit, their faith or heritage, how they loved, how they left."
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Casting the chart…
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Reveal the Death Chart Reading
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {loading && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="relative">
              <div className="h-14 w-14 animate-spin rounded-full border-2 border-gold/20 border-t-gold" />
              <Sparkles className="absolute inset-0 m-auto h-5 w-5 text-gold-light" />
            </div>
            <p className="max-w-sm font-serif text-lg text-foreground/80 transition-opacity">
              {LOADING_LINES[loadingLine]}
            </p>
            <p className="text-xs text-muted-foreground">
              This can take up to a minute. Thank you for your patience.
            </p>
          </CardContent>
        </Card>
      )}

      {result && (
        <div ref={resultRef} className="scroll-mt-24 animate-fade-up">
          <ReadingDisplay data={result} />
        </div>
      )}
    </div>
  );
}

function TypeToggle({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm transition-all",
        active
          ? "border-gold/60 bg-gold/10 text-gold-light shadow-[0_0_20px_-8px_rgba(233,196,106,0.6)]"
          : "border-white/8 bg-black/20 text-foreground/60 hover:border-white/20"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
