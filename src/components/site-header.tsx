import Link from "next/link";
import Image from "next/image";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-background/70 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <Image
            src="/logo.png"
            alt="GraveSigns"
            width={1200}
            height={1116}
            className="h-10 w-auto transition-transform group-hover:scale-105"
          />
          <div className="leading-tight">
            <span className="block font-serif text-lg tracking-wide gold-text">
              GraveSigns
            </span>
            <span className="block text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Truestherb
            </span>
          </div>
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link
            href="/#reading"
            className="text-foreground/70 transition-colors hover:text-gold-light"
          >
            New Reading
          </Link>
          <Link
            href="/readings"
            className="text-foreground/70 transition-colors hover:text-gold-light"
          >
            Previous Readings
          </Link>
        </nav>
      </div>
    </header>
  );
}
