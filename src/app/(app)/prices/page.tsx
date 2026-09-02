import { db, isDbConfigured } from "@/lib/supabase";
import type { UnitPrice } from "@/lib/types";
import { PriceEditor } from "./price-editor";

export const dynamic = "force-dynamic";

export default async function PricesPage() {
  if (!isDbConfigured()) {
    return (
      <div className="p-6">
        <h1 className="text-base font-semibold">Unit prices</h1>
        <p className="mt-2 text-sm text-red-600">Supabase is not configured.</p>
      </div>
    );
  }

  const { data } = await db()
    .from("unit_prices")
    .select("*")
    .order("category")
    .order("item_code");

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-base font-semibold">Unit prices</h1>
      <PriceEditor prices={(data ?? []) as UnitPrice[]} />
    </div>
  );
}
