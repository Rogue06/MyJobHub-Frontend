"use client";

import * as React from "react";
import { FileText, RefreshCw, Folder, ExternalLink, Search, FileCheck, ScrollText } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { cn } from "@/lib/utils";

interface DocumentFile {
  name: string;
  relativePath: string;
  category: "cv" | "lettre" | "rapport" | "autre";
  parent: string;
  sizeBytes: number;
  modifiedAt: string;
}

const CATEGORY_LABEL: Record<DocumentFile["category"], string> = {
  cv: "CV",
  lettre: "Lettre",
  rapport: "Rapport",
  autre: "Autre",
};

const CATEGORY_ICON: Record<DocumentFile["category"], React.ElementType> = {
  cv: FileCheck,
  lettre: ScrollText,
  rapport: FileText,
  autre: FileText,
};

export default function DocumentsPage() {
  const { activeWorkspace } = useWorkspace();
  const [loading, setLoading] = React.useState(true);
  const [docs, setDocs] = React.useState<DocumentFile[]>([]);
  const [search, setSearch] = React.useState("");
  const [tab, setTab] = React.useState<"all" | DocumentFile["category"]>("all");

  const load = React.useCallback(async () => {
    if (!activeWorkspace) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/workspaces/${activeWorkspace.id}/documents`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Lecture impossible");
        return;
      }
      setDocs(json.documents);
    } catch (err) {
      toast.error(`Erreur : ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }, [activeWorkspace]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const openFile = async (relativePath: string, reveal: boolean) => {
    if (!activeWorkspace) return;
    try {
      const res = await fetch(`/api/workspaces/${activeWorkspace.id}/open`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ relativePath, reveal }),
      });
      const json = await res.json();
      if (!res.ok) toast.error(json.error ?? "Ouverture impossible");
    } catch (err) {
      toast.error(`Erreur : ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  if (!activeWorkspace) {
    return (
      <PageShell title="Documents générés">
        <EmptyState icon={FileText} title="Aucun profil actif" description="Sélectionne un profil pour voir tes documents." />
      </PageShell>
    );
  }

  const filtered = docs.filter((d) => {
    if (tab !== "all" && d.category !== tab) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return d.name.toLowerCase().includes(q) || d.parent.toLowerCase().includes(q);
    }
    return true;
  });

  const counts = {
    all: docs.length,
    cv: docs.filter((d) => d.category === "cv").length,
    lettre: docs.filter((d) => d.category === "lettre").length,
    rapport: docs.filter((d) => d.category === "rapport").length,
    autre: docs.filter((d) => d.category === "autre").length,
  };

  return (
    <PageShell
      title="Documents générés"
      description={`Profil actif : ${activeWorkspace.name}`}
      actions={
        <Button variant="outline" size="sm" onClick={() => void load()}>
          <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} /> Recharger
        </Button>
      }
    >
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-72" />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      ) : docs.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Aucun document pour le moment"
          description="Lance une première évaluation d'offre, les CV adaptés et lettres de motivation apparaîtront ici."
        />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher un fichier ou une entreprise"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
              <TabsList>
                <TabsTrigger value="all">Tous ({counts.all})</TabsTrigger>
                <TabsTrigger value="cv">CV ({counts.cv})</TabsTrigger>
                <TabsTrigger value="lettre">Lettres ({counts.lettre})</TabsTrigger>
                <TabsTrigger value="rapport">Rapports ({counts.rapport})</TabsTrigger>
                <TabsTrigger value="autre">Autres ({counts.autre})</TabsTrigger>
              </TabsList>
            </Tabs>
            <p className="ml-auto text-xs text-muted-foreground">
              {filtered.length} fichier{filtered.length > 1 ? "s" : ""}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((d) => {
              const Icon = CATEGORY_ICON[d.category];
              return (
                <Card key={d.relativePath}>
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{d.name}</p>
                        <p className="truncate font-mono text-[10px] text-muted-foreground">{d.parent}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary" className="font-normal">
                        {CATEGORY_LABEL[d.category]}
                      </Badge>
                      <span>{formatSize(d.sizeBytes)}</span>
                      <span>{formatDate(d.modifiedAt)}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openFile(d.relativePath, false)}>
                        <ExternalLink className="mr-2 h-3 w-3" /> Ouvrir
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => openFile(d.relativePath, true)}>
                        <Folder className="mr-2 h-3 w-3" /> Révéler
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </PageShell>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  } catch {
    return iso.slice(0, 10);
  }
}
