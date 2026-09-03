import { loadEstimates } from "@/lib/estimates-list";
import { isDbConfigured } from "@/lib/supabase";
import { EstimatesTable } from "./estimates-table";

export const dynamic = "force-dynamic";

export default async function EstimatesPage() {
  if (!isDbConfigured()) {
    return (
      <div className="p-6">
        <h1 className="text-base font-semibold">Estimates</h1>
        <p className="mt-2 text-sm text-red-600">Supabase is not configured.</p>
      </div>
    );
  }

  const rows = await loadEstimates();

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-base font-semibold">Estimates</h1>
      <EstimatesTable rows={rows} />
    </div>
  );
}
