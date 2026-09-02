import { NextResponse } from "next/server";
import { generateEstimate } from "@/lib/estimate";

export const runtime = "nodejs";
export const maxDuration = 300;

/** Generate a new estimate version for a solicitation. */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const estimate = await generateEstimate(id);
    return NextResponse.json({ ok: true, estimateId: estimate.id, version: estimate.version });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
