"use client";

import * as React from "react";
import Link from "next/link";
import { Compass, Plus, Send, ListChecks, Filter, FileText, Settings, AlertTriangle, CheckCircle2 } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/empty-state";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const QUICK_ACTIONS = [
  {
    title: "Évaluer une offre",
    description: "Colle une URL ou un texte d'annonce, l'IA fait le reste.",
    href: "/evaluer",
    icon: Send,
  },
  {
    title: "Trier les annonces",
    description: "Affine tes filtres en marquant ce qui te plaît ou pas.",
    href: "/triage",
    icon: Filter,
  },
  {
    title: "Mes candidatures",
    description: "Suivi de tous tes envois et leur statut.",
    href: "/candidatures",
    icon: ListChecks,
  },
  {
    title: "Documents générés",
    description: "Retrouve tes CV et lettres prêts à envoyer.",
    href: "/documents",
    icon: FileText,
  },
];

export default function DashboardPage() {
  const { activeWorkspace, config } = useWorkspace();

  return (
    <PageShell title="Tableau de bord" description="Vue d'ensemble de ta recherche d'emploi">
      {!activeWorkspace ? (
        <EmptyState
          icon={Compass}
          title="Bienvenue sur Boussole"
          description={
            config.workspaces.length === 0
              ? "Crée ton premier profil de recherche pour commencer. Tu pourras importer ton CV en PDF, on s'occupe du reste."
              : "Choisis un profil dans le sélecteur en haut à droite, ou crée-en un nouveau."
          }
          action={
            <Link href="/profils/nouveau" className={cn(buttonVariants(), "gap-2")}>
              <Plus className="h-4 w-4" />
              Créer un profil
            </Link>
          }
        />
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="text-lg">{activeWorkspace.name}</CardTitle>
                <CardDescription className="font-mono text-xs">{activeWorkspace.path}</CardDescription>
              </div>
              <HealthBadge workspace={activeWorkspace} />
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Link
                href="/profil"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}
              >
                <Settings className="h-4 w-4" /> Configurer
              </Link>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {QUICK_ACTIONS.map((a) => (
              <Link key={a.href} href={a.href} className="block">
                <Card className="h-full transition-colors hover:bg-accent/50">
                  <CardHeader>
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <a.icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-base">{a.title}</CardTitle>
                    <CardDescription>{a.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </PageShell>
  );
}

function HealthBadge({ workspace }: { workspace: { health: string; healthDetails?: string } }) {
  if (workspace.health === "ok") {
    return (
      <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
        <CheckCircle2 className="h-3.5 w-3.5" /> Profil prêt
      </div>
    );
  }
  if (workspace.health === "warning") {
    return (
      <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-400">
        <AlertTriangle className="h-3.5 w-3.5" /> À vérifier
      </div>
    );
  }
  if (workspace.health === "error") {
    return (
      <div className="flex items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-700 dark:text-red-400">
        <AlertTriangle className="h-3.5 w-3.5" /> Erreur
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
      Non vérifié
    </div>
  );
}
