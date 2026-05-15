"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface TooltipProps {
  content: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  delay?: number;
  className?: string;
  children: React.ReactNode;
}

interface Coords {
  top: number;
  left: number;
  side: "top" | "bottom" | "left" | "right";
}

export function Tooltip({ content, side = "top", delay = 200, className, children }: TooltipProps) {
  const [open, setOpen] = React.useState(false);
  const [coords, setCoords] = React.useState<Coords | null>(null);
  const [mounted, setMounted] = React.useState(false);
  const wrapperRef = React.useRef<HTMLSpanElement>(null);
  const tooltipRef = React.useRef<HTMLSpanElement>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const computePosition = React.useCallback(() => {
    if (!wrapperRef.current) return;
    const triggerRect = wrapperRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current?.getBoundingClientRect();
    const tooltipW = tooltipRect?.width ?? 240;
    const tooltipH = tooltipRect?.height ?? 36;
    const gap = 8;
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    let preferredSide = side;
    // Auto-flip if not enough room
    if (preferredSide === "top" && triggerRect.top < tooltipH + gap + 4) preferredSide = "bottom";
    if (preferredSide === "bottom" && viewportH - triggerRect.bottom < tooltipH + gap + 4) preferredSide = "top";

    let top = 0;
    let left = 0;

    switch (preferredSide) {
      case "top":
        top = triggerRect.top - tooltipH - gap;
        left = triggerRect.left + triggerRect.width / 2 - tooltipW / 2;
        break;
      case "bottom":
        top = triggerRect.bottom + gap;
        left = triggerRect.left + triggerRect.width / 2 - tooltipW / 2;
        break;
      case "left":
        top = triggerRect.top + triggerRect.height / 2 - tooltipH / 2;
        left = triggerRect.left - tooltipW - gap;
        break;
      case "right":
        top = triggerRect.top + triggerRect.height / 2 - tooltipH / 2;
        left = triggerRect.right + gap;
        break;
    }

    // Clamp to viewport
    left = Math.max(8, Math.min(left, viewportW - tooltipW - 8));
    top = Math.max(8, Math.min(top, viewportH - tooltipH - 8));

    setCoords({ top, left, side: preferredSide });
  }, [side]);

  const show = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setOpen(true);
      requestAnimationFrame(() => requestAnimationFrame(computePosition));
    }, delay);
  };
  const hide = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(false), 80);
  };

  React.useEffect(() => {
    if (!open) return;
    const onResize = () => computePosition();
    window.addEventListener("scroll", onResize, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onResize, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, computePosition]);

  return (
    <>
      <span
        ref={wrapperRef}
        className="inline-flex"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {children}
      </span>
      {mounted
        ? createPortal(
            <span
              ref={tooltipRef}
              role="tooltip"
              aria-hidden={!open}
              className={cn(
                "pointer-events-none fixed z-[9999] max-w-xs whitespace-normal rounded-md border bg-popover px-2.5 py-1.5 text-[11px] leading-snug text-popover-foreground shadow-md transition-opacity duration-150",
                open ? "opacity-100" : "opacity-0",
                className
              )}
              style={
                coords
                  ? { top: `${coords.top}px`, left: `${coords.left}px` }
                  : { top: "-9999px", left: "-9999px" }
              }
            >
              {content}
            </span>,
            document.body
          )
        : null}
    </>
  );
}
