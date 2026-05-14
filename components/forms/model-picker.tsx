"use client";

import * as React from "react";
import { Cpu } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CLAUDE_MODEL_OPTIONS, ClaudeModelChoice } from "@/lib/claude-models";
import { cn } from "@/lib/utils";

interface Props {
  value: ClaudeModelChoice;
  onChange: (next: ClaudeModelChoice) => void;
  storageKey?: string;
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
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {!compact ? (
        <Label className="flex items-center gap-1.5 text-xs">
          <Cpu className="h-3 w-3" /> Modèle Claude
        </Label>
      ) : null}
      <Select value={value} onValueChange={(v) => onChange((v as ClaudeModelChoice) ?? "default")}>
        <SelectTrigger className={cn("h-8 w-[210px] text-xs", compact && "h-7")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CLAUDE_MODEL_OPTIONS.map((opt) => (
            <SelectItem key={opt.id} value={opt.id}>
              <div className="flex flex-col">
                <span className="text-sm">{opt.label}</span>
                <span className="text-[10px] text-muted-foreground">{opt.description}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
