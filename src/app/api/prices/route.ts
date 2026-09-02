import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import type { PriceCategory, PriceUnit } from "@/lib/types";

export const runtime = "nodejs";

const CATEGORIES: PriceCategory[] = [
  "asbestos", "mold", "radon", "sewer", "tank", "testing", "hazmat", "general",
];
const UNITS: PriceUnit[] = ["sf", "lf", "ea", "hr", "day", "ls", "cy"];

interface PriceInput {
  id?: string;
  category?: string;
  item_code?: string;
  description?: string;
  unit?: string;
  unit_cost?: number | string;
  unit_price?: number | string;
  notes?: string | null;
  active?: boolean;
}

/** Upsert one or many unit prices, keyed on item_code. */
export async function PUT(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { rows?: PriceInput[] };
  const rows = body.rows ?? [];
  if (!rows.length) {
    return NextResponse.json({ error: "No rows supplied." }, { status: 400 });
  }

  const valid: Record<string, unknown>[] = [];
  const rejected: { item_code: string; reason: string }[] = [];

  for (const row of rows) {
    const itemCode = String(row.item_code ?? "").trim();
    if (!itemCode) {
      rejected.push({ item_code: "(blank)", reason: "item_code is required" });
      continue;
    }
    const category = String(row.category ?? "").trim().toLowerCase();
    if (!CATEGORIES.includes(category as PriceCategory)) {
      rejected.push({ item_code: itemCode, reason: `category must be one of ${CATEGORIES.join(", ")}` });
      continue;
    }
    const unit = String(row.unit ?? "").trim().toLowerCase();
    if (!UNITS.includes(unit as PriceUnit)) {
      rejected.push({ item_code: itemCode, reason: `unit must be one of ${UNITS.join(", ")}` });
      continue;
    }
    const description = String(row.description ?? "").trim();
    if (!description) {
      rejected.push({ item_code: itemCode, reason: "description is required" });
      continue;
    }

    valid.push({
      category,
      item_code: itemCode,
      description,
      unit,
      unit_cost: Number(row.unit_cost) || 0,
      unit_price: Number(row.unit_price) || 0,
      notes: row.notes ?? null,
      active: row.active ?? true,
    });
  }

  if (!valid.length) {
    return NextResponse.json({ error: "Every row was rejected.", rejected }, { status: 400 });
  }

  const { error, count } = await db()
    .from("unit_prices")
    .upsert(valid, { onConflict: "item_code", count: "exact" });

  if (error) return NextResponse.json({ error: error.message, rejected }, { status: 500 });
  return NextResponse.json({ ok: true, saved: count ?? valid.length, rejected });
}

/** The whole price book as CSV, in the shape the importer accepts back. */
export async function GET() {
  const { data } = await db().from("unit_prices").select("*").order("category").order("item_code");

  const header = ["category", "item_code", "description", "unit", "unit_cost", "unit_price", "notes", "active"];
  const rows = (data ?? []).map((p) => [
    p.category,
    p.item_code,
    p.description,
    p.unit,
    Number(p.unit_cost).toFixed(2),
    Number(p.unit_price).toFixed(2),
    p.notes ?? "",
    String(p.active),
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map((cell: string) => (/[",\r\n]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell)).join(","))
    .join("\r\n");

  return new Response(`﻿${csv}`, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="unit-prices.csv"',
    },
  });
}
