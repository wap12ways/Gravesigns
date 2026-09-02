import { loadPipeline } from "@/lib/pipeline";
import { isDbConfigured } from "@/lib/supabase";
import { PipelineTable } from "./pipeline-table";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  if (!isDbConfigured()) {
    return (
      <div className="p-6">
        <h1 className="text-base font-semibold">Pipeline</h1>
        <p className="mt-2 max-w-lg text-sm text-red-600">
          Supabase is not configured. Set <code>SUPABASE_URL</code> and{" "}
          <code>SUPABASE_SERVICE_ROLE_KEY</code>, then reload.
        </p>
      </div>
    );
  }

  const rows = await loadPipeline();

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-base font-semibold">Pipeline</h1>
      <PipelineTable rows={rows} />
    </div>
  );
}
