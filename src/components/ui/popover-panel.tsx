"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface PopoverPanelProps {
  anchorRef: React.RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

/**
 * A floating panel portaled to <body> and positioned under its anchor. Using a
 * portal keeps dropdowns from being clipped by ancestor `overflow-hidden`, and
 * fixed positioning (recomputed on scroll/resize) keeps it pinned to the field.
 */
export function PopoverPanel({
  anchorRef,
  open,
  onClose,
  children,
  className,
}: PopoverPanelProps) {
  const [mounted, setMounted] = React.useState(false);
  const [rect, setRect] = React.useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => setMounted(true), []);

  const reposition = React.useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setRect({ top: r.bottom + 8, left: r.left, width: r.width });
  }, [anchorRef]);

  React.useLayoutEffect(() => {
    if (!open) return;
    reposition();
    const onScroll = () => reposition();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open, reposition]);

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t)) return;
      if (anchorRef.current?.contains(t)) return;
      onClose();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, onClose, anchorRef]);

  if (!mounted || !open || !rect) return null;

  return createPortal(
    <div
      ref={panelRef}
      style={{
        position: "fixed",
        top: rect.top,
        left: rect.left,
        width: rect.width,
        zIndex: 60,
      }}
      className={cn(
        "origin-top overflow-hidden rounded-2xl border border-gold/20 bg-[#141226]/95 shadow-2xl shadow-black/60 backdrop-blur-xl animate-fade-up",
        className
      )}
    >
      {children}
    </div>,
    document.body
  );
}
