"use client";

import * as React from "react";
import * as Icons from "lucide-react";
import { Terminal, Sparkles } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/empty-state";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { groupActionsByUsage, USAGE_GROUPS } from "@/lib/usage-groups";
import { ActionCard } from "./_components/action-card";
import { cn } from "@/lib/utils";

export default function ActionsPage() {
  const { activeWorkspace } = useWorkspace();
  const sectionsRef = React.useRef<Record<string, HTMLElement | null>>({});

  if (!activeWorkspace) {
    return (
      <PageShell title="Actions">
        <EmptyState
          icon={Terminal}
          title="Aucun profil actif"
          description="Sélectionne un profil pour accéder à toutes les commandes career-ops."
        />
      </PageShell>
    );
  }

  const grouped = groupActionsByUsage();

  const scrollTo = (id: string) => {
    const el = sectionsRef.current[id];
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 100;
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <PageShell
      title="Actions career-ops"
      description="Toutes les commandes regroupées par usage : trouver, rédiger, analyser, postuler, apprendre…"
    >
      <div className="space-y-6">
        <nav className="sticky top-2 z-20 flex flex-wrap gap-2 rounded-lg border bg-background/95 p-2 backdrop-blur">
          {USAGE_GROUPS.map((group) => {
            const actions = grouped[group.id];
            if (!actions || actions.length === 0) return null;
            const Icon =
              (Icons as unknown as Record<string, React.ElementType>)[group.iconName] ?? Sparkles;
            return (
              <button
                key={group.id}
                onClick={() => scrollTo(group.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md border border-transparent px-2.5 py-1.5 text-xs font-medium transition-colors",
                  group.color.surface,
                  group.color.text,
                  "hover:border-current/30"
                )}
              >
                <Icon className="h-3 w-3" />
                {group.label}
                <span className="rounded-full bg-background/60 px-1.5 py-0 text-[10px] font-normal">
                  {actions.length}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="space-y-10">
          {USAGE_GROUPS.map((group) => {
            const actions = grouped[group.id];
            if (!actions || actions.length === 0) return null;
            const Icon =
              (Icons as unknown as Record<string, React.ElementType>)[group.iconName] ?? Sparkles;
            return (
              <section
                key={group.id}
                ref={(el) => {
                  sectionsRef.current[group.id] = el;
                }}
                id={`group-${group.id}`}
                className={cn("space-y-4 rounded-xl border p-5 scroll-mt-24", group.color.border, group.color.surface)}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white",
                      group.color.accent
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className={cn("text-base font-semibold", group.color.text)}>{group.label}</h2>
                    <p className="text-xs text-muted-foreground">{group.tagline}</p>
                  </div>
                  <span className="rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {actions.length} action{actions.length > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {actions.map((a) => (
                    <ActionCard key={a.id} action={a} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </PageShell>
  );
}
