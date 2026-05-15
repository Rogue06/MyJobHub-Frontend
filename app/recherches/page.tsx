"use client";

import * as React from "react";
import {
  Search,
  ExternalLink,
  Layers,
  RefreshCw,
  Lock,
  KeyRound,
  ShieldCheck,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { SOURCE_CATEGORIES, SourceCategory } from "@/lib/sources";
import { cn } from "@/lib/utils";

interface BuiltSearch {
  sourceId: string;
  siteName: string;
  url: string;
  description: string;
  requiresLogin: "no" | "optional" | "recommended";
  category: SourceCategory;
}

const LOGIN_STYLE: Record<BuiltSearch["requiresLogin"], { label: string; icon: React.ElementType; className: string }> = {
  no: {
    label: "Sans compte",
    icon: ShieldCheck,
    className: "text-emerald-700 dark:text-emerald-400 bg-emerald-500/10",
  },
  optional: {
    label: "Compte optionnel",
    icon: KeyRound,
    className: "text-blue-700 dark:text-blue-400 bg-blue-500/10",
  },
  recommended: {
    label: "Compte recommandé",
    icon: Lock,
    className: "text-amber-700 dark:text-amber-400 bg-amber-500/10",
  },
};

export default function RecherchesPage() {
  const { activeWorkspace } = useWorkspace();
  const [loading, setLoading] = React.useState(true);
  const [searches, setSearches] = React.useState<BuiltSearch[]>([]);

  const load = React.useCallback(async () => {
    if (!activeWorkspace) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/workspaces/${activeWorkspace.id}/search-urls`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Lecture impossible");
        return;
      }
      setSearches(json.searches ?? []);
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
      <PageShell title="Recherches en direct">
        <EmptyState
          icon={Search}
          title="Aucun profil actif"
          description="Sélectionne un profil pour voir tes recherches pré-construites."
        />
      </PageShell>
    );
  }

  const openOne = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const openAll = (searches: BuiltSearch[]) => {
    if (searches.length === 0) return;
    if (searches.length > 8) {
      const ok = window.confirm(
        `Tu vas ouvrir ${searches.length} onglets en même temps. Continuer ?`
      );
      if (!ok) return;
    }
    let opened = 0;
    for (const s of searches) {
      const w = window.open(s.url, "_blank", "noopener,noreferrer");
      if (w) opened++;
    }
    if (opened === 0) {
      toast.error("Le navigateur a bloqué les pop-ups. Autorise-les pour localhost:3000 et réessaie.");
    } else if (opened < searches.length) {
      toast.warning(
        `${opened}/${searches.length} onglets ouverts. Le navigateur a bloqué les autres. Autorise les pop-ups pour tout ouvrir.`
      );
    } else {
      toast.success(`${opened} recherches ouvertes dans ton navigateur.`);
    }
  };

  const grouped: Record<SourceCategory, BuiltSearch[]> = {
    generaliste: [],
    "banque-finance": [],
    alternance: [],
    "carrieres-directes": [],
  };
  for (const s of searches) grouped[s.category].push(s);

  return (
    <PageShell
      title="Recherches en direct"
      description="Tes critères pré-remplis sur chaque site. Tu cliques, ton navigateur s'ouvre où tu es déjà connecté."
      actions={
        <>
          <Button variant="outline" size="sm" onClick={() => void load()}>
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} /> Recharger
          </Button>
          <Button size="sm" onClick={() => openAll(searches)} disabled={searches.length === 0}>
            <Layers className="mr-2 h-4 w-4" /> Tout ouvrir ({searches.length})
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Comment utiliser cette page</AlertTitle>
          <AlertDescription className="text-xs">
            On ne stocke pas tes identifiants. Les liens ouvrent simplement les sites dans ton navigateur, où ta session
            est déjà active. Pour les sites avec « compte recommandé » (LinkedIn, JobTeaser…), tu verras plus de résultats
            si tu es connecté avant de cliquer. Quand une annonce t'intéresse, copie son URL dans <strong>Triage → Inbox</strong>.
          </AlertDescription>
        </Alert>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : searches.length === 0 ? (
          <EmptyState
            icon={Search}
            title="Aucune source activée"
            description="Active des sites dans Configuration → Sources, puis reviens ici."
          />
        ) : (
          (Object.keys(SOURCE_CATEGORIES) as SourceCategory[]).map((cat) => {
            const list = grouped[cat];
            if (list.length === 0) return null;
            const catCfg = SOURCE_CATEGORIES[cat];
            return (
              <section key={cat} className="space-y-3">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold">{catCfg.label}</h2>
                    <p className="text-xs text-muted-foreground">{catCfg.description}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => openAll(list)}>
                    Ouvrir cette catégorie ({list.length})
                  </Button>
                </div>
                <Separator />
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {list.map((s) => {
                    const loginStyle = LOGIN_STYLE[s.requiresLogin];
                    const Icon = loginStyle.icon;
                    return (
                      <Card key={s.sourceId} className="flex flex-col">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-sm">{s.siteName}</CardTitle>
                            <Badge variant="secondary" className={cn("gap-1 text-[10px]", loginStyle.className)}>
                              <Icon className="h-3 w-3" />
                              {loginStyle.label}
                            </Badge>
                          </div>
                          <CardDescription className="text-xs">{s.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="mt-auto flex flex-col gap-2">
                          <p className="break-all rounded bg-muted/50 px-2 py-1 font-mono text-[10px] leading-tight text-muted-foreground">
                            {s.url}
                          </p>
                          <Button size="sm" onClick={() => openOne(s.url)} className="self-start">
                            <ExternalLink className="mr-2 h-3 w-3" /> Ouvrir cette recherche
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </section>
            );
          })
        )}
      </div>
    </PageShell>
  );
}
