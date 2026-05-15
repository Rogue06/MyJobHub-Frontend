"use client";

import * as React from "react";
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

/**
 * Sélecteur de modèle Claude — implémentation HTML native pour éviter
 * les bugs de Menu.Item de base-ui qui dans certains contextes
 * n'émettait pas l'onClick et bloquait la sélection.
 */
export function ModelPicker({ value, onChange, className, compact = false }: Props) {
  const [open, setOpen] = React.useState(false);
  const [openUpwards, setOpenUpwards] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  const current = CLAUDE_MODEL_OPTIONS.find((o) => o.id === value) ?? CLAUDE_MODEL_OPTIONS[0];

  React.useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
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

  const toggle = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuHeight = 260;
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUpwards(spaceBelow < menuHeight && rect.top > menuHeight);
    }
    setOpen((o) => !o);
  };

  return (
    <div ref={containerRef} className={cn("relative inline-block", className)}>
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

      {open ? (
        <div
          role="listbox"
          className={cn(
            "absolute left-0 z-50 w-[300px] rounded-md border bg-popover p-1 shadow-lg",
            openUpwards ? "bottom-full mb-1" : "top-full mt-1"
          )}
        >
          {CLAUDE_MODEL_OPTIONS.map((opt) => {
            const selected = opt.id === value;
            return (
              <button
                key={opt.id}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onChange(opt.id);
                  setOpen(false);
                }}
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
        </div>
      ) : null}
    </div>
  );
}
