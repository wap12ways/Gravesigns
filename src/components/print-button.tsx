"use client";

import { Printer } from "lucide-react";

/** Triggers the browser print dialog, from which the reading can be saved as a
 *  PDF keepsake. The print stylesheet in globals.css renders a light, gentle
 *  page and hides the app chrome. */
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-4 py-2 text-xs tracking-wide text-gold-light/85 transition hover:border-gold/50 hover:text-gold-light"
    >
      <Printer className="h-4 w-4" />
      Save as keepsake (PDF)
    </button>
  );
}
