"use client";

import * as React from "react";
import { ListChecks, RefreshCw, Inbox, TrendingUp, FileText, Mail } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { cn } from "@/lib/utils";

interface Application {
  id: string;
  index: string;
  date: string;
  company: string;
  role: string;
  score: string;
  status: string;
  pdf: string;
  report: string;
}

interface Stats {
  total: number;
  byStatus: Record<string, number>;
  averageScore: number | null;
  withPdfPct: number;
  withReportPct: number;
}

const STATUS_COLORS: Record<string, string> = {
  Evaluated: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  Applied: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  Responded: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  Contact: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
  Interview: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  Offer: "bg-green-500/10 text-green-700 dark:text-green-300",
  Rejected: "bg-red-500/10 text-red-700 dark:text-red-300",
  Discarded: "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300",
  Skip: "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300",
};

const STATUS_LABELS_FR: Record<string, string> = {
  Evaluated: "Évaluée",
  Applied: "Candidature envoyée",
  Responded: "Réponse reçue",
  Contact: "Contact proactif",
  Interview: "Entretien",
  Offer: "Offre reçue",
  Rejected: "Refusée",
  Discarded: "Écartée",
  Skip: "À ne pas postuler",
};

export default function CandidaturesPage() {
  const { activeWorkspace } = useWorkspace();
  const [loading, setLoading] = React.useState(true);
  const [applications, setApplications] = React.useState<Application[]>([]);
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [filterStatus, setFilterStatus] = React.useState<string>("all");
  const [search, setSearch] = React.useState("");

  const load = React.useCallback(async () => {
    if (!activeWorkspace) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/workspaces/${activeWorkspace.id}/tracker`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Lecture impossible");
        return;
      }
      setApplications(json.applications);
      setStats(json.stats);
    } catch (err) {
      toast.error(`Erreur : ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }, [activeWorkspace]);

  React.useEffect(() => {
    void load();
  }, [load]);

  if (!activeWorkspace) {
    return (
      <PageShell title="Mes candidatures">
        <EmptyState icon={ListChecks} title="Aucun profil actif" description="Sélectionne un profil pour voir tes candidatures." />
      </PageShell>
    );
  }

  const filtered = applications.filter((a) => {
    if (filterStatus !== "all" && a.status !== filterStatus) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        a.company.toLowerCase().includes(q) ||
        a.role.toLowerCase().includes(q) ||
        a.score.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const allStatuses = Array.from(new Set(applications.map((a) => a.status).filter(Boolean)));

  return (
    <PageShell
      title="Mes candidatures"
      description={`Profil actif : ${activeWorkspace.name}`}
      actions={
        <Button variant="outline" size="sm" onClick={() => void load()}>
          <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} /> Recharger
        </Button>
      }
    >
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : applications.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Aucune candidature pour le moment"
          description="Évalue tes premières offres, elles apparaîtront ici avec leur score et statut."
        />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard icon={ListChecks} label="Candidatures" value={String(stats?.total ?? 0)} />
            <StatCard
              icon={TrendingUp}
              label="Score moyen"
              value={stats?.averageScore != null ? stats.averageScore.toFixed(1) : "—"}
            />
            <StatCard
              icon={FileText}
              label="Avec CV généré"
              value={`${Math.round(stats?.withPdfPct ?? 0)} %`}
            />
            <StatCard
              icon={Mail}
              label="Avec rapport"
              value={`${Math.round(stats?.withReportPct ?? 0)} %`}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Input
              placeholder="Rechercher une entreprise, un poste…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v ?? "all")}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {allStatuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABELS_FR[s] ?? s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="ml-auto text-xs text-muted-foreground">
              {filtered.length} / {applications.length} candidature{applications.length > 1 ? "s" : ""}
            </p>
          </div>

          <div className="overflow-x-auto rounded-lg border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Entreprise</th>
                  <th className="px-4 py-2 text-left">Poste</th>
                  <th className="px-4 py-2 text-left">Score</th>
                  <th className="px-4 py-2 text-left">Statut</th>
                  <th className="px-4 py-2 text-left">Documents</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id} className="border-t hover:bg-accent/30">
                    <td className="px-4 py-2 text-xs text-muted-foreground">{a.date || "—"}</td>
                    <td className="px-4 py-2 font-medium">{a.company || "—"}</td>
                    <td className="px-4 py-2 text-muted-foreground">{a.role || "—"}</td>
                    <td className="px-4 py-2">
                      {a.score ? (
                        <Badge variant="outline" className="font-mono">
                          {a.score}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {a.status ? (
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-medium",
                            STATUS_COLORS[a.status] ?? "bg-muted text-muted-foreground"
                          )}
                        >
                          {STATUS_LABELS_FR[a.status] ?? a.status}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      <span className="flex gap-2">
                        {a.pdf && a.pdf !== "-" ? <Badge variant="secondary">PDF</Badge> : null}
                        {a.report && a.report !== "-" ? <Badge variant="secondary">Rapport</Badge> : null}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PageShell>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
