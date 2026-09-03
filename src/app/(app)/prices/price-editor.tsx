"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usd } from "@/lib/money";
import type { PriceCategory, PriceUnit, UnitPrice } from "@/lib/types";

const CATEGORIES: PriceCategory[] = [
  "asbestos", "mold", "radon", "sewer", "tank", "testing", "lead", "demo", "hazmat", "general",
];
const UNITS: PriceUnit[] = ["sf", "lf", "ea", "hr", "day", "ls", "cy"];

export function PriceEditor({ prices }: { prices: UnitPrice[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<UnitPrice[]>(prices);
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [category, setCategory] = useState<"all" | PriceCategory>("all");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (category !== "all" && row.category !== category) return false;
      if (!needle) return true;
      return `${row.item_code} ${row.description} ${row.notes ?? ""}`.toLowerCase().includes(needle);
    });
  }, [rows, category, search]);

  const placeholders = rows.filter((r) => r.notes?.startsWith("PLACEHOLDER")).length;

  function update(itemCode: string, patch: Partial<UnitPrice>) {
    setRows((current) =>
      current.map((row) => (row.item_code === itemCode ? { ...row, ...patch } : row)),
    );
    setDirty((current) => new Set(current).add(itemCode));
  }

  function addRow() {
    const itemCode = `NEW-${Date.now().toString(36).toUpperCase()}`;
    setRows((current) => [
      {
        id: itemCode,
        category: "general",
        item_code: itemCode,
        description: "",
        unit: "ls",
        unit_cost: 0,
        unit_price: 0,
        notes: null,
        active: true,
        updated_at: new Date().toISOString(),
      },
      ...current,
    ]);
    setDirty((current) => new Set(current).add(itemCode));
  }

  async function save(toSave?: UnitPrice[]) {
    const payload = toSave ?? rows.filter((row) => dirty.has(row.item_code));
    if (!payload.length) {
      setMessage("Nothing changed.");
      return;
    }
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/prices", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rows: payload }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? `HTTP ${response.status}`);
      setDirty(new Set());
      const rejected = body.rejected?.length
        ? ` ${body.rejected.length} rejected: ${body.rejected
            .map((r: { item_code: string; reason: string }) => `${r.item_code} (${r.reason})`)
            .join("; ")}`
        : "";
      setMessage(`Saved ${body.saved} row(s).${rejected}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function importCsv(file: File) {
    setError(null);
    setMessage(null);
    try {
      const parsed = parseCsv(await file.text());
      if (!parsed.length) throw new Error("No data rows found in that file.");
      await save(parsed as UnitPrice[]);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as "all" | PriceCategory)}
          className="field w-40"
        >
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter…"
          className="field w-56"
        />
        <button onClick={addRow} className="btn-ghost">
          + Add item
        </button>
        <label className="btn-ghost cursor-pointer">
          Import CSV
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void importCsv(file);
              e.target.value = "";
            }}
          />
        </label>
        <a href="/api/prices" className="btn-ghost">
          Export CSV
        </a>
        <button
          onClick={() => save()}
          disabled={saving || dirty.size === 0}
          className="btn ml-auto"
        >
          {saving ? "Saving…" : dirty.size ? `Save ${dirty.size} change(s)` : "Saved"}
        </button>
      </div>

      {(message || error || placeholders > 0) && (
        <div className="space-y-1 text-2xs">
          {message && <p className="text-alpha-dark">{message}</p>}
          {error && <p className="text-red-600">{error}</p>}
          {placeholders > 0 && (
            <p className="text-amber-700">
              {placeholders} of {rows.length} rates are still seeded placeholders. Replace them
              before quoting real work — clear the PLACEHOLDER note once a rate is real.
            </p>
          )}
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="op-table">
          <thead>
            <tr>
              <th className="w-32">Item code</th>
              <th className="w-24">Category</th>
              <th>Description</th>
              <th className="w-16">Unit</th>
              <th className="w-24 text-right">Cost</th>
              <th className="w-24 text-right">Price</th>
              <th className="w-20 text-right">Margin</th>
              <th className="w-56">Notes</th>
              <th className="w-14 text-center">Active</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => {
              const margin =
                Number(row.unit_price) > 0
                  ? ((Number(row.unit_price) - Number(row.unit_cost)) / Number(row.unit_price)) * 100
                  : 0;
              return (
                <tr key={row.item_code} className={dirty.has(row.item_code) ? "bg-alpha-light/50" : ""}>
                  <td>
                    <input
                      value={row.item_code}
                      onChange={(e) => update(row.item_code, { item_code: e.target.value })}
                      className="field font-mono text-2xs"
                    />
                  </td>
                  <td>
                    <select
                      value={row.category}
                      onChange={(e) => update(row.item_code, { category: e.target.value as PriceCategory })}
                      className="field text-2xs"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      value={row.description}
                      onChange={(e) => update(row.item_code, { description: e.target.value })}
                      className="field"
                    />
                  </td>
                  <td>
                    <select
                      value={row.unit}
                      onChange={(e) => update(row.item_code, { unit: e.target.value as PriceUnit })}
                      className="field text-2xs"
                    >
                      {UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      value={row.unit_cost}
                      onChange={(e) => update(row.item_code, { unit_cost: Number(e.target.value) })}
                      className="field text-right tabular-nums"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      value={row.unit_price}
                      onChange={(e) => update(row.item_code, { unit_price: Number(e.target.value) })}
                      className="field text-right tabular-nums"
                    />
                  </td>
                  <td
                    className={`text-right tabular-nums text-2xs ${
                      margin < 15 ? "text-red-600" : "text-slate-500"
                    }`}
                  >
                    {margin.toFixed(0)}%
                  </td>
                  <td>
                    <input
                      value={row.notes ?? ""}
                      onChange={(e) => update(row.item_code, { notes: e.target.value })}
                      className={`field text-2xs ${
                        row.notes?.startsWith("PLACEHOLDER") ? "text-amber-700" : ""
                      }`}
                    />
                  </td>
                  <td className="text-center">
                    <input
                      type="checkbox"
                      checked={row.active}
                      onChange={(e) => update(row.item_code, { active: e.target.checked })}
                      className="accent-alpha"
                    />
                  </td>
                </tr>
              );
            })}
            {!visible.length && (
              <tr>
                <td colSpan={9} className="text-slate-500">
                  Nothing matches. Run <code>supabase/seed/unit_prices.sql</code> if the book is empty.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-2xs text-slate-500">
        CSV columns: category, item_code, description, unit, unit_cost, unit_price, notes, active.
        Import matches on item_code — existing rows are updated, new codes are added, nothing is
        deleted. Export first to get the exact shape.
      </p>
    </div>
  );
}

/** Small RFC-4180 reader: quoted fields, escaped quotes, CRLF or LF. */
function parseCsv(text: string): Partial<UnitPrice>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  const body = text.replace(/^﻿/, "");
  for (let i = 0; i < body.length; i++) {
    const char = body[i];
    if (inQuotes) {
      if (char === '"') {
        if (body[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  const [header, ...dataRows] = rows.filter((r) => r.some((cell) => cell.trim()));
  if (!header) return [];
  const columns = header.map((h) => h.trim().toLowerCase());

  return dataRows.map((cells) => {
    const get = (name: string) => {
      const index = columns.indexOf(name);
      return index === -1 ? "" : (cells[index] ?? "").trim();
    };
    return {
      category: get("category") as PriceCategory,
      item_code: get("item_code"),
      description: get("description"),
      unit: get("unit") as PriceUnit,
      unit_cost: Number(get("unit_cost")) || 0,
      unit_price: Number(get("unit_price")) || 0,
      notes: get("notes") || null,
      active: get("active") ? get("active").toLowerCase() !== "false" : true,
    };
  });
}
