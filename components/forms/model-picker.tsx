"use client";

import * as React from "react";
import { Cpu, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

export function ModelPicker({ value, onChange, className, compact = false }: Props) {
  const current = CLAUDE_MODEL_OPTIONS.find((o) => o.id === value) ?? CLAUDE_MODEL_OPTIONS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size={compact ? "sm" : "default"}
            className={cn("gap-2 font-normal", className)}
          />
        }
      >
        <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs">{current.label}</span>
        <ChevronDown className="h-3 w-3 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[280px]">
        {CLAUDE_MODEL_OPTIONS.map((opt) => {
          const selected = opt.id === value;
          return (
            <DropdownMenuItem
              key={opt.id}
              onClick={() => onChange(opt.id)}
              className="flex cursor-pointer items-start gap-2"
            >
              <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
                {selected ? <Check className="h-3.5 w-3.5 text-primary" /> : null}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{opt.label}</span>
                <span className="text-[11px] text-muted-foreground">{opt.description}</span>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
