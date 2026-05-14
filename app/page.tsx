"use client";

import * as React from "react";
import Link from "next/link";
import {
  Compass,
  Plus,
  Send,
  ListChecks,
  Filter,
  FileText,
  Settings,
  Terminal,
  ArrowRight,
  TrendingUp,
  ListTodo,
  Mail,
  Lightbulb,
  Sparkles,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/empty-state";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { JOB_SEARCH_TIPS } from "@/lib/tips";
import { cn } from "@/lib/utils";

interface Stats {
  candidatureCount: number;
  averageScore: number | null;
  pipelinePending: number;
  rejections: number;
  documentsCount: number;
  reportsCount: number;
  lastScanAt: string | null;
  staleFollowups: number;
  byStatus: Record<string, number>;
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  priority: "high" | "medium" | "low";
}

const QUICK_ACTIONS = [
  { title: "Évaluer une offre", description: "URL ou texte", href: "/evaluer", icon: Send, accent: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-300" },
  { title: "Trier les annonces", description: "Inbox + filtres", href: "/triage", icon: Filter, accent: "bg-blue-500/10 text-blue-600 dark:text-blue-300" },
  { title: "Mes candidatures", description: "Suivi détaillé", href: "/candidatures", icon: ListChecks, accent: "bg-purple-500/10 text-purple-600 dark:text-purple-300" },
  { title: "Mes documents", description: "CV + lettres", href: "/documents", icon: FileText, accent: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300" },
  { title: "Toutes les actions", description: "Commandes career-ops", href: "/actions", icon: Terminal, accent: "bg-amber-500/10 text-amber-600 dark:text-amber-300" },
  { title: "Configurer le profil", description: "CV, sources, préférences", href: "/profil", icon: Settings, accent: "bg-pink-500/10 text-pink-600 dark:text-pink-300" },
];

function greeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 6) return "Bonne nuit";
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  if (h < 22) return "Bonsoir";
  return "Bonne soirée";
}

export default function DashboardPage() {
  const { activeWorkspace, config } = useWorkspace();
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [recos, setRecos] = React.useState<Recommendation[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [tip, setTip] = React.useState(JOB_SEARCH_TIPS[0]);

  React.useEffect(() => {
    setTip(JOB_SEARCH_TIPS[Math.floor(Math.random() * JOB_SEARCH_TIPS.length)]);
  }, []);

  React.useEffect(() => {
    if (!activeWorkspace) return;
    setLoading(true);
    fetch(`/api/workspaces/${activeWorkspace.id}/dashboard`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data.stats) setStats(data.stats);
        if (data.recommendations) setRecos(data.recommendations);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeWorkspace]);

  if (!activeWorkspace) {
    return (
      <PageShell title="Tableau de bord" description="Vue d'ensemble de ta recherche d'emploi">
        <EmptyState
          icon={Compass}
          title="Bienvenue sur MyJobHub"
          description={
            config.workspaces.length === 0
              ? "Crée ton premier profil de recherche pour commencer, ou importe un dossier career-ops existant."
              : "Sélectionne un profil dans le sélecteur en haut à droite."
          }
          action={
            <Link href="/profils/nouveau" className={cn(buttonVariants(), "gap-2")}>
              <Plus className="h-4 w-4" /> Créer un profil
            </Link>
          }
        />
      </PageShell>
    );
  }

  return (
    <PageShell title="Tableau de bord" description={`Profil actif : ${activeWorkspace.name}`}>
      <div className="space-y-8">
        <HeroBanner stats={stats} loading={loading} workspaceName={activeWorkspace.name} />

        {recos.length > 0 ? (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <h2 className="text-sm font-semibold">Prochaines actions recommandées</h2>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {recos.map((r) => (
                <RecommendationCard key={r.id} reco={r} />
              ))}
            </div>
          </section>
        ) : null}

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Statistiques de ce profil</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard icon={ListChecks} label="Candidatures" value={stats?.candidatureCount ?? 0} loading={loading} />
            <StatCard
              icon={TrendingUp}
              label="Score moyen"
              value={stats?.averageScore != null ? stats.averageScore.toFixed(1) : "—"}
              loading={loading}
              accent="text-emerald-600 dark:text-emerald-400"
            />
            <StatCard
              icon={ListTodo}
              label="Inbox en attente"
              value={stats?.pipelinePending ?? 0}
              loading={loading}
              accent={stats && stats.pipelinePending > 0 ? "text-blue-600 dark:text-blue-400" : undefined}
            />
            <StatCard
              icon={Mail}
              label="Documents générés"
              value={(stats?.documentsCount ?? 0) + (stats?.reportsCount ?? 0)}
              loading={loading}
            />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Accès rapide</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {QUICK_ACTIONS.map((a) => (
              <Link key={a.href} href={a.href} className="group block">
                <Card className="h-full transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className={cn("mb-2 flex h-10 w-10 items-center justify-center rounded-lg", a.accent)}>
                      <a.icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="flex items-center justify-between text-sm">
                      {a.title}
                      <ArrowRight className="h-3.5 w-3.5 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-60" />
                    </CardTitle>
                    <CardDescription className="text-xs">{a.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-start gap-3 rounded-lg border bg-gradient-to-br from-amber-500/5 via-transparent to-rose-500/5 p-4">
            <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Astuce du jour
              </p>
              <p className="mt-0.5 text-sm leading-snug">{tip}</p>
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  );
}

function HeroBanner({
  stats,
  loading,
  workspaceName,
}: {
  stats: Stats | null;
  loading: boolean;
  workspaceName: string;
}) {
  const hello = greeting();
  const message = stats?.staleFollowups
    ? `${stats.staleFollowups} candidature${stats.staleFollowups > 1 ? "s" : ""} à relancer ce matin.`
    : stats?.pipelinePending
      ? `${stats.pipelinePending} offre${stats.pipelinePending > 1 ? "s" : ""} t'attendent dans l'inbox.`
      : "Bonne chance pour ta recherche d'emploi !";

  return (
    <div className="overflow-hidden rounded-xl border bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-emerald-500/5 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {workspaceName}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{hello} 👋</h1>
          {loading ? (
            <Skeleton className="mt-2 h-4 w-72" />
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">{message}</p>
          )}
        </div>
        {stats?.lastScanAt ? (
          <Badge variant="secondary" className="font-normal">
            Dernier scan {formatRelative(stats.lastScanAt)}
          </Badge>
        ) : null}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  loading,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  loading: boolean;
  accent?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-7 w-16" />
        ) : (
          <p className={cn("text-2xl font-bold", accent)}>{value}</p>
        )}
      </CardContent>
    </Card>
  );
}

function RecommendationCard({ reco }: { reco: Recommendation }) {
  const priorityStyles =
    reco.priority === "high"
      ? "border-amber-500/40 bg-amber-500/5"
      : reco.priority === "medium"
        ? "border-blue-500/30 bg-blue-500/5"
        : "border-border";
  return (
    <Link href={reco.ctaHref} className="group block">
      <Card className={cn("h-full transition-all hover:-translate-y-0.5 hover:shadow-sm", priorityStyles)}>
        <CardContent className="space-y-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold leading-tight">{reco.title}</p>
            {reco.priority === "high" ? (
              <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
                Prioritaire
              </span>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">{reco.description}</p>
          <div className="flex items-center gap-1 text-xs font-medium text-primary">
            {reco.ctaLabel}
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function formatRelative(iso: string): string {
  const now = Date.now();
  const t = Date.parse(iso);
  if (isNaN(t)) return "récemment";
  const diffMin = Math.floor((now - t) / 60000);
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `il y a ${diffH} h`;
  const diffD = Math.floor(diffH / 24);
  return `il y a ${diffD} j`;
}
