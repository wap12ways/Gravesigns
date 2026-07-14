import Link from "next/link";
import { Moon, Compass, HeartHandshake } from "lucide-react";
import { GraveSignsMark } from "@/components/logo";
import { Starfield } from "@/components/starfield";
import { ReadingForm } from "@/components/reading-form";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <Starfield />
        <div className="container relative flex flex-col items-center px-6 pb-16 pt-20 text-center sm:pt-28">
          <GraveSignsMark className="mb-8 h-28 w-32 animate-fade-up drop-shadow-[0_0_35px_rgba(233,196,106,0.25)]" />

          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-4 py-1.5 text-[11px] uppercase tracking-[0.28em] text-gold-light/80">
            Truestherb · Death Chart Readings
          </span>

          <h1 className="max-w-3xl font-serif text-5xl leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
            The sky remembers
            <br />
            <span className="gold-text">the moment of crossing.</span>
          </h1>

          <p className="mt-7 max-w-xl text-lg leading-relaxed text-foreground/70">
            When a loved one passes — a person or a cherished animal — the
            heavens hold a chart of that exact moment. GraveSigns reads it with
            the care of a practitioner who has spent a lifetime with charts of
            transition, and offers it back to you as comfort.
          </p>

          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="#reading">Begin a Reading</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/readings">View Previous Readings</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* What it is */}
      <section className="container px-6 py-12">
        <div className="grid gap-5 md:grid-cols-3">
          <Feature
            icon={<Compass className="h-6 w-6" />}
            title="A true chart, precisely cast"
            body="We calculate the real planetary positions, aspects, houses, and lunar phase for the moment of passing using a high-precision ephemeris."
          />
          <Feature
            icon={<Moon className="h-6 w-6" />}
            title="Read as a transition"
            body="The Moon as the soul's vehicle, Saturn and Pluto at the threshold, the North Node's long walk — interpreted for endings, not beginnings."
          />
          <Feature
            icon={<HeartHandshake className="h-6 w-6" />}
            title="Written with tenderness"
            body="Every reading is composed to be safe to read in grief — dignified, specific, and gentle. For people and pets alike."
          />
        </div>
      </section>

      {/* The reading form */}
      <section id="reading" className="container scroll-mt-20 px-6 py-12">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <h2 className="font-serif text-4xl gold-text">
              Cast a Death Chart Reading
            </h2>
            <p className="mt-3 text-foreground/60">
              Only a name and a date are needed. A time and place, when known,
              deepen the reading with the rising sign and houses.
            </p>
          </div>
          <ReadingForm />
        </div>
      </section>
    </>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="glass rounded-3xl p-7">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/10 text-gold-light">
        {icon}
      </div>
      <h3 className="font-serif text-xl text-foreground/90">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-foreground/60">{body}</p>
    </div>
  );
}
