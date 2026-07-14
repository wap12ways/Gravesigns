import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-serif",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "GraveSigns — Death Chart Readings",
  description:
    "Compassionate, astrologer-grade Death Chart Readings for the moment a soul crosses — human or beloved pet. Part of the Truestherb platform.",
  metadataBase: new URL("https://gravesigns.vercel.app"),
  openGraph: {
    title: "GraveSigns — Death Chart Readings",
    description:
      "A contemplative reading of the sky at the moment of crossing, prepared with the care of a practitioner who specializes in charts of transition.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} dark`}>
      <body className="min-h-screen">
        <div className="no-print">
          <SiteHeader />
        </div>
        <main>{children}</main>
        <footer className="no-print mt-24 border-t border-white/5 py-10">
          <div className="container flex flex-col items-center gap-2 text-center text-sm text-muted-foreground">
            <p className="gold-text font-serif text-lg">GraveSigns</p>
            <p className="max-w-md text-xs leading-relaxed">
              A practice within the Truestherb platform. Death Chart Readings are
              offered as contemplative comfort and are not a substitute for
              medical, legal, or grief-care services.
            </p>
            <p className="mt-2 text-xs text-muted-foreground/60">
              © {new Date().getFullYear()} Truestherb · GraveSigns
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
