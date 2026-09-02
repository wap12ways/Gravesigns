"use client";

export function PrintButton() {
  return (
    <div className="no-print mb-6 flex items-center gap-3 rounded border border-slate-200 bg-slate-50 p-3 text-sm">
      <button onClick={() => window.print()} className="btn">
        Print / Save as PDF
      </button>
      <span className="text-2xs text-slate-500">
        Choose “Save as PDF” as the destination. Everything below prints; this bar does not.
      </span>
    </div>
  );
}
