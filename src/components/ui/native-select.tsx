import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type NativeSelectProps =
  React.SelectHTMLAttributes<HTMLSelectElement>;

/** A lightweight, dark-themed native <select> styled to match the inputs. */
const NativeSelect = React.forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            "flex h-11 w-full appearance-none rounded-xl border border-input bg-black/20 px-4 pr-10 py-2 text-sm text-foreground ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:border-gold/40 disabled:cursor-not-allowed disabled:opacity-50 [color-scheme:dark]",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
      </div>
    );
  }
);
NativeSelect.displayName = "NativeSelect";

export { NativeSelect };
