"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Cpu, Check, ChevronDown } from "lucide-react";
import { CLAUDE_MODEL_OPTIONS, ClaudeModelChoice } from "@/lib/claude-models";
import { cn } from "@/lib/utils";

interface Props {
  value: ClaudeModelChoice;
  onChange: (next: ClaudeModelChoice) => void;
  className?: string;
  compact?: boolean;
}

export function useModelPreference(storageKey: string, fallback: ClaudeModelChoice = "default") {
  const [model, setModel] = React.useState<ClaudeModelChoice>(fallback);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(storageKey) as ClaudeModelChoice | null;
    if (stored && CLAUDE_MODEL_OPTIONS.some((o) => o.id === stored)) {
      setModel(stored);
    }
  }, [storageKey]);

  const update = React.useCallback(
    (next: ClaudeModelChoice) => {
      setModel(next);
      if (typeof window !== "undefined") localStorage.setItem(storageKey, next);
    },
    [storageKey]
  );

  return [model, update] as const;
}

interface MenuPosition {
  top: number;
  left: number;
  minWidth: number;
  openUpwards: boolean;
}

const MENU_WIDTH = 300;
const MENU_HEIGHT_ESTIMATE = 260;

export function ModelPicker({ value, onChange, className, compact = false }: Props) {
  const [open, setOpen] = React.useState(false);
  const [position, setPosition] = React.useState<MenuPosition | null>(null);
  const [mounted, setMounted] = React.useState(false);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const current = CLAUDE_MODEL_OPTIONS.find((o) => o.id === value) ?? CLAUDE_MODEL_OPTIONS[0];

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const computePosition = React.useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUpwards = spaceBelow < MENU_HEIGHT_ESTIMATE && spaceAbove > spaceBelow;

    const gap = 4;
    const minWidth = Math.max(rect.width, MENU_WIDTH);

    let left = rect.left;
    // Clamp horizontally to viewport
    if (left + minWidth > window.innerWidth - 8) {
      left = window.innerWidth - minWidth - 8;
    }
    left = Math.max(8, left);

    const top = openUpwards ? rect.top - MENU_HEIGHT_ESTIMATE - gap : rect.bottom + gap;

    setPosition({ top, left, minWidth, openUpwards });
  }, []);

  React.useEffect(() => {
    if (!open) return;
    computePosition();
    const onScrollOrResize = () => computePosition();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open, computePosition]);

  React.useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (buttonRef.current?.contains(e.target as Node)) return;
      if (menuRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [open]);

  const toggle = () => setOpen((o) => !o);

  const handleSelect = (id: ClaudeModelChoice) => {
    onChange(id);
    setOpen(false);
  };

  return (
    <div className={cn("relative inline-block", className)}>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "inline-flex items-center gap-2 rounded-md border border-input bg-background text-foreground transition-colors hover:bg-accent",
          compact ? "h-7 px-2.5 text-xs" : "h-9 px-3 text-sm"
        )}
      >
        <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="font-medium">{current.label}</span>
        <ChevronDown
          className={cn("h-3 w-3 opacity-60 transition-transform", open && "rotate-180")}
        />
      </button>

      {mounted && open
        ? createPortal(
            <div
              ref={menuRef}
              role="listbox"
              className="fixed z-[9999] rounded-md border bg-popover p-1 shadow-lg"
              style={
                position
                  ? {
                      top: `${position.top}px`,
                      left: `${position.left}px`,
                      minWidth: `${position.minWidth}px`,
                    }
                  : { top: "-9999px", left: "-9999px" }
              }
            >
              {CLAUDE_MODEL_OPTIONS.map((opt) => {
                const selected = opt.id === value;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => handleSelect(opt.id)}
                    className={cn(
                      "flex w-full items-start gap-2 rounded-sm px-2 py-2 text-left transition-colors hover:bg-accent",
                      selected && "bg-accent/50"
                    )}
                  >
                    <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
                      {selected ? <Check className="h-3.5 w-3.5 text-primary" /> : null}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium leading-tight">{opt.label}</span>
                      <span className="text-[11px] leading-tight text-muted-foreground">
                        {opt.description}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
