"use client";

import * as React from "react";
import { CheckCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DEFAULT_SOURCES,
  SOURCE_CATEGORIES,
  SourceCategory,
  getSourcesByCategory,
} from "@/lib/sources";

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
}

export function SourcesEditor({ value, onChange }: Props) {
  const grouped = React.useMemo(() => getSourcesByCategory(), []);

  const isEnabled = (id: string) => value.includes(id);
  const toggle = (id: string) =>
    onChange(isEnabled(id) ? value.filter((x) => x !== id) : [...value, id]);
  const toggleCategory = (cat: SourceCategory, enable: boolean) => {
    const ids = grouped[cat].map((s) => s.id);
    const set = new Set(value);
    ids.forEach((i) => (enable ? set.add(i) : set.delete(i)));
    onChange(Array.from(set));
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm">
        <span>
          <strong>{value.length}</strong> source{value.length > 1 ? "s" : ""} active{value.length > 1 ? "s" : ""} sur {DEFAULT_SOURCES.length}
        </span>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => onChange(DEFAULT_SOURCES.map((s) => s.id))}>
            <CheckCheck className="mr-1 h-3 w-3" /> Tout cocher
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onChange([])}>
            <X className="mr-1 h-3 w-3" /> Tout décocher
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {(Object.keys(SOURCE_CATEGORIES) as SourceCategory[]).map((cat, idx) => {
          const cfg = SOURCE_CATEGORIES[cat];
          const sources = grouped[cat];
          const activeInCat = sources.filter((s) => isEnabled(s.id)).length;
          return (
            <section key={cat} className="space-y-3">
              {idx > 0 ? <Separator /> : null}
              <div className="flex items-start justify-between gap-3 pt-2">
                <div>
                  <h3 className="text-sm font-semibold">{cfg.label}</h3>
                  <p className="text-xs text-muted-foreground">{cfg.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {activeInCat}/{sources.length}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleCategory(cat, activeInCat !== sources.length)}
                  >
                    {activeInCat === sources.length ? "Tout décocher" : "Tout cocher"}
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {sources.map((s) => (
                  <Label
                    key={s.id}
                    htmlFor={`src-${s.id}`}
                    className="flex cursor-pointer items-start gap-3 rounded-md border bg-card px-3 py-2 transition-colors hover:bg-accent/40"
                  >
                    <Switch id={`src-${s.id}`} checked={isEnabled(s.id)} onCheckedChange={() => toggle(s.id)} />
                    <div className="flex-1">
                      <p className="text-sm font-medium leading-tight">{s.name}</p>
                      <p className="break-all text-xs text-muted-foreground">{s.description ?? s.url}</p>
                    </div>
                  </Label>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
