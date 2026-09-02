import { notFound } from "next/navigation";
import { db } from "@/lib/supabase";
import type { Estimate, Solicitation, UnitPrice } from "@/lib/types";
import { EstimateEditor } from "./editor";

export const dynamic = "force-dynamic";

export default async function EstimatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = db();

  const { data: estimate } = await supabase
    .from("estimates")
    .select("*")
    .eq("id", id)
    .maybeSingle<Estimate>();
  if (!estimate) notFound();

  const [{ data: bid }, { data: prices }] = await Promise.all([
    supabase
      .from("solicitations")
      .select("id, source_bid_number, title")
      .eq("id", estimate.solicitation_id)
      .maybeSingle<Solicitation>(),
    supabase
      .from("unit_prices")
      .select("*")
      .eq("active", true)
      .order("item_code"),
  ]);

  return (
    <EstimateEditor
      estimate={estimate}
      prices={(prices ?? []) as UnitPrice[]}
      bidNumber={bid?.source_bid_number ?? "—"}
      bidTitle={bid?.title ?? null}
      solicitationId={estimate.solicitation_id}
    />
  );
}
