import Link from "next/link";
import { Moon } from "lucide-react";
import { listReadings, isSupabaseConfigured } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export default async function ReadingsPage() {
  const configured = isSupabaseConfigured();
  const readings = configured ? await listReadings(24) : [];

  return (
    <div className="container px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 text-center">
          <h1 className="font-serif text-4xl gold-text">Previous Readings</h1>
          <p className="mt-3 text-foreground/60">
            A quiet archive of the charts we&apos;ve cast.
          </p>
        </div>

        {!configured && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-foreground/70">
                Saved readings appear here once Supabase is connected.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                The app runs fully in demo mode without it — every reading is
                still calculated and composed, just not stored.
              </p>
              <Button asChild className="mt-6">
                <Link href="/#reading">Cast a Reading</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {configured && readings.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-foreground/70">No readings have been cast yet.</p>
              <Button asChild className="mt-6">
                <Link href="/#reading">Cast the First Reading</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {readings.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {readings.map((r) => (
              <Link key={r.id} href={`/readings/${r.id}`}>
                <Card className="h-full transition-transform hover:-translate-y-0.5 hover:border-gold/30">
                  <CardContent className="py-6">
                    <div className="flex items-center justify-between">
                      <span className="text-xs italic text-muted-foreground/70">
                        {r.subject_type === "pet" ? "A beloved companion" : "In memoriam"}
                      </span>
                      <Moon className="h-4 w-4 text-gold-light/50" />
                    </div>
                    <h3 className="mt-2 font-serif text-2xl text-foreground/90">
                      {r.full_name}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatDate(r.date_of_death)}
                      {r.place ? ` · ${r.place}` : ""}
                    </p>
                    <p className="mt-3 text-xs text-gold-light/70">
                      {r.chart?.moonPhase} · {r.chart?.dominantElement}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
