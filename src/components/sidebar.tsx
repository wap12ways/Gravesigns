"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  /** Announced but not built. Rendered inert with a "Soon" tag. */
  soon?: boolean;
}

const NAV: NavItem[] = [
  { href: "/", label: "Pipeline" },
  { href: "/estimates", label: "Estimates" },
  { href: "/cost-library", label: "Cost library" },
  { href: "/intake", label: "Intake" },
  { href: "/takeoff", label: "Takeoff", soon: true },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="no-print flex w-48 shrink-0 flex-col bg-ink-900 text-slate-300">
      <div className="border-b border-ink-700 px-4 py-4">
        <div className="text-sm font-semibold text-white">Alpha Estimate</div>
        <div className="mt-0.5 text-2xs uppercase tracking-wide text-slate-500">
          OregonBuys
        </div>
      </div>

      <div className="flex-1 py-2">
        {NAV.map((item) => {
          if (item.soon) {
            return (
              <div
                key={item.href}
                title="Not built yet"
                aria-disabled="true"
                className="flex cursor-default items-center gap-2 border-l-2 border-transparent px-4 py-2 text-sm text-slate-600"
              >
                {item.label}
                <span className="rounded bg-ink-700 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                  Soon
                </span>
              </div>
            );
          }

          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-2 text-sm transition ${
                active
                  ? "border-l-2 border-alpha bg-ink-800 pl-[14px] font-medium text-white"
                  : "border-l-2 border-transparent hover:bg-ink-800 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      <form
        className="border-t border-ink-700 p-3"
        onSubmit={async (event) => {
          event.preventDefault();
          await fetch("/api/login", { method: "DELETE" });
          window.location.href = "/login";
        }}
      >
        <button type="submit" className="text-2xs uppercase tracking-wide text-slate-500 hover:text-slate-300">
          Sign out
        </button>
      </form>
    </nav>
  );
}
