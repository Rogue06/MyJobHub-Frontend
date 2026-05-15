"use client";

import * as React from "react";
import * as Icons from "lucide-react";
import { Terminal, Sparkles, Wand2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { groupActionsByUsage, USAGE_GROUPS } from "@/lib/usage-groups";
import {
  applyRecommendedModelsEverywhere,
  countRecommendationsApplied,
  resetAllModelPrefs,
  MODEL_PREFS_EVENT,
} from "@/lib/model-prefs";
import { ActionCard } from "./_components/action-card";
import { cn } from "@/lib/utils";

export default function ActionsPage() {
  const { activeWorkspace } = useWorkspace();
  const sectionsRef = React.useRef<Record<string, HTMLElement | null>>({});
  const [recoStatus, setRecoStatus] = React.useState({ applied: 0, total: 0 });

  React.useEffect(() => {
    const update = () => setRecoStatus(countRecommendationsApplied());
    update();
    if (typeof window !== "undefined") {
      window.addEventListener(MODEL_PREFS_EVENT, update);
      return () => window.removeEventListener(MODEL_PREFS_EVENT, update);
    }
  }, []);

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
  const allRecoApplied = recoStatus.total > 0 && recoStatus.applied === recoStatus.total;

  const scrollTo = (id: string) => {
    const el = sectionsRef.current[id];
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 120;
    window.scrollTo({ top, behavior: "smooth" });
  };

  const applyAll = () => {
    const result = applyRecommendedModelsEverywhere();
    toast.success(
      `${result.updated} modèles recommandés appliqués sur ${result.total} actions configurables.`
    );
  };

  const resetAll = () => {
    resetAllModelPrefs();
    toast.success("Tous les modèles réinitialisés au défaut.");
  };

  return (
    <PageShell
      title="Actions career-ops"
      description="Toutes les commandes regroupées par usage : trouver, rédiger, analyser, postuler, apprendre…"
      actions={
        <>
          <Button
            variant={allRecoApplied ? "outline" : "default"}
            size="sm"
            onClick={applyAll}
            className={cn(!allRecoApplied && "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600")}
          >
            <Wand2 className="mr-2 h-4 w-4" />
            {allRecoApplied
              ? `✓ Recos actives (${recoStatus.applied}/${recoStatus.total})`
              : `Utiliser les modèles recommandés (${recoStatus.applied}/${recoStatus.total})`}
          </Button>
          <Button variant="ghost" size="sm" onClick={resetAll}>
            <RotateCcw className="mr-2 h-3 w-3" />
            Réinitialiser
          </Button>
        </>
      }
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
