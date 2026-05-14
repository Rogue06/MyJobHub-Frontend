"use client";

import * as React from "react";
import { Terminal } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/empty-state";
import { Separator } from "@/components/ui/separator";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { ACTION_CATEGORIES, actionsByCategory, ActionCategory } from "@/lib/actions-catalog";
import { CATEGORY_STYLES } from "@/lib/action-styles";
import { ActionCard } from "./_components/action-card";
import { cn } from "@/lib/utils";

export default function ActionsPage() {
  const { activeWorkspace } = useWorkspace();

  if (!activeWorkspace) {
    return (
      <PageShell title="Actions">
        <EmptyState
          icon={Terminal}
          title="Aucun profil actif"
          description="Sélectionne un profil pour lancer des actions career-ops."
        />
      </PageShell>
    );
  }

  const grouped = actionsByCategory();
  const categories = Object.keys(ACTION_CATEGORIES) as ActionCategory[];

  return (
    <PageShell
      title="Actions career-ops"
      description="Toutes les commandes et scripts disponibles, avec les mêmes options qu'en terminal."
    >
      <div className="space-y-10">
        {categories.map((cat) => {
          const actions = grouped[cat];
          if (actions.length === 0) return null;
          const cfg = ACTION_CATEGORIES[cat];
          const style = CATEGORY_STYLES[cat];
          return (
            <section key={cat} className="space-y-4">
              <div className="flex items-center gap-3">
                <span className={cn("inline-block h-6 w-1 rounded-full", style.iconBg.replace("/10", ""))} />
                <div>
                  <h2 className="text-base font-semibold">{cfg.label}</h2>
                  <p className="text-xs text-muted-foreground">{cfg.description}</p>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {actions.map((a) => (
                  <ActionCard key={a.id} action={a} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </PageShell>
  );
}
