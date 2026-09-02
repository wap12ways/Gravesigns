import type { BidRecommendation } from "@/lib/types";

/** 0–100 fit score. Colour bands match how an estimator triages: green = work it. */
export function ScoreBadge({ score }: { score: number | null | undefined }) {
  if (score === null || score === undefined) {
    return <span className="inline-block w-9 rounded bg-slate-200 px-1.5 py-0.5 text-center text-2xs font-semibold text-slate-500">—</span>;
  }
  const tone =
    score >= 70 ? "bg-alpha text-white"
    : score >= 45 ? "bg-amber-500 text-white"
    : "bg-slate-400 text-white";
  return (
    <span className={`inline-block w-9 rounded px-1.5 py-0.5 text-center text-2xs font-semibold tabular-nums ${tone}`}>
      {score}
    </span>
  );
}

const RECOMMENDATION_LABEL: Record<BidRecommendation, string> = {
  bid: "Bid",
  review: "Review",
  no_bid: "No bid",
};

const RECOMMENDATION_TONE: Record<BidRecommendation, string> = {
  bid: "border-alpha bg-alpha-light text-alpha-dark",
  review: "border-amber-300 bg-amber-50 text-amber-800",
  no_bid: "border-slate-300 bg-slate-100 text-slate-500",
};

export function RecommendationBadge({
  value,
}: {
  value: BidRecommendation | null | undefined;
}) {
  if (!value) {
    return <span className="text-2xs text-slate-400">not analysed</span>;
  }
  return (
    <span
      className={`inline-block whitespace-nowrap rounded border px-1.5 py-0.5 text-2xs font-medium ${RECOMMENDATION_TONE[value]}`}
    >
      {RECOMMENDATION_LABEL[value]}
    </span>
  );
}

export function Flag({ on, label }: { on: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-2xs ${
        on ? "border-amber-300 bg-amber-50 text-amber-800" : "border-slate-200 bg-white text-slate-400"
      }`}
    >
      <span aria-hidden>{on ? "●" : "○"}</span>
      {label}
    </span>
  );
}
