"use client";

import * as React from "react";
import {
  Filter,
  RefreshCw,
  Plus,
  Check,
  X,
  Sparkles,
  Loader2,
  Inbox,
  Trash2,
  ExternalLink,
  Wand2,
  AlertCircle,
  Zap,
  Radar,
  FileText,
  CheckSquare,
} from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LogEvent, consumeSseStream } from "@/components/log-viewer";
import { ScanProgress } from "@/components/scan-progress";
import { ModelPicker, useModelPreference } from "@/components/forms/model-picker";
import { Tooltip } from "@/components/ui/tooltip";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { REJECTION_REASONS, RejectionReason } from "@/lib/triage-types";
import { cn } from "@/lib/utils";

interface PipelineEntry {
  status: "pending" | "processed" | "error";
  url: string;
  raw: string;
  company?: string;
  role?: string;
  score?: string;
  note?: string;
}

interface FeedbackEntry {
  id: string;
  createdAt: string;
  url: string;
  title?: string;
  company?: string;
  reason: RejectionReason;
  note?: string;
}

interface TriageData {
  pipeline: PipelineEntry[];
  feedback: { rejections: FeedbackEntry[]; approvals: { id: string; url: string; createdAt: string }[] };
}

type ScanMode = "fast" | "agent" | "auto" | "auto-light";

interface ProposalChange {
  field: string;
  action: "add" | "remove" | "set";
  value: unknown;
  reason: string;
}

interface Proposal {
  summary: string;
  changes: ProposalChange[];
}

export default function TriagePage() {
  const { activeWorkspace } = useWorkspace();
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<TriageData | null>(null);
  const [newUrl, setNewUrl] = React.useState("");
  const [refining, setRefining] = React.useState(false);
  const [proposal, setProposal] = React.useState<Proposal | null>(null);
  const [acceptedChanges, setAcceptedChanges] = React.useState<Set<number>>(new Set());
  const [applying, setApplying] = React.useState(false);
  const [scanRunning, setScanRunning] = React.useState<false | ScanMode>(false);
  const [scanLogs, setScanLogs] = React.useState<LogEvent[]>([]);
  const [scanFinished, setScanFinished] = React.useState(false);
  const [scanModel, setScanModel] = useModelPreference("myjobhub-model-scan");
  const [confirmMode, setConfirmMode] = React.useState<ScanMode | null>(null);
  const [selectedUrls, setSelectedUrls] = React.useState<Set<string>>(new Set());
  const [generating, setGenerating] = React.useState(false);
  const [generateLogs, setGenerateLogs] = React.useState<LogEvent[]>([]);
  const [generateDone, setGenerateDone] = React.useState(false);
  const [confirmGenerate, setConfirmGenerate] = React.useState(false);
  const [generateModel, setGenerateModel] = useModelPreference("myjobhub-model-generate-docs");

  const toggleSelect = (url: string) => {
    setSelectedUrls((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  };

  const generateDocs = async () => {
    if (!activeWorkspace || selectedUrls.size === 0) return;
    setGenerating(true);
    setGenerateDone(false);
    setGenerateLogs([]);
    setConfirmGenerate(false);
    try {
      const res = await fetch(`/api/workspaces/${activeWorkspace.id}/generate-docs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: Array.from(selectedUrls), model: generateModel }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        toast.error(j.error ?? "Génération impossible");
        return;
      }
      await consumeSseStream(res, (evt) => {
        setGenerateLogs((prev) => [...prev, evt]);
        if (evt.type === "done") {
          setGenerateDone(true);
          void load();
        }
        if (evt.type === "error") toast.error(evt.message);
      });
      setSelectedUrls(new Set());
    } catch (err) {
      toast.error(`Erreur : ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setGenerating(false);
    }
  };

  const load = React.useCallback(async () => {
    if (!activeWorkspace) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/workspaces/${activeWorkspace.id}/triage`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Lecture impossible");
        return;
      }
      setData(json);
    } catch (err) {
      toast.error(`Erreur : ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }, [activeWorkspace]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const scan = async (mode: ScanMode) => {
    if (!activeWorkspace) return;
    setScanRunning(mode);
    setScanFinished(false);
    setScanLogs([]);
    try {
      const isAuto = mode === "auto" || mode === "auto-light";
      const endpoint = isAuto
        ? `/api/workspaces/${activeWorkspace.id}/auto-pipeline`
        : `/api/workspaces/${activeWorkspace.id}/scan`;
      const body = isAuto
        ? {
            scanMode: "agent",
            evalMode: mode === "auto-light" ? "light" : "complete",
            model: scanModel,
          }
        : { mode, model: scanModel };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        toast.error(j.error ?? "Démarrage du scan impossible");
        return;
      }
      await consumeSseStream(res, (evt) => {
        setScanLogs((prev) => [...prev, evt]);
        if (evt.type === "done") {
          setScanFinished(true);
          void load();
        }
        if (evt.type === "error") {
          toast.error(evt.message);
        }
      });
    } catch (err) {
      toast.error(`Erreur : ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setScanRunning(false);
    }
  };

  const addUrl = async () => {
    if (!activeWorkspace || !newUrl.trim()) return;
    try {
      const res = await fetch(`/api/workspaces/${activeWorkspace.id}/triage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "addUrl", url: newUrl.trim() }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        toast.error(j.error ?? "Ajout impossible");
        return;
      }
      toast.success("URL ajoutée à l'inbox");
      setNewUrl("");
      void load();
    } catch (err) {
      toast.error(`Erreur : ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const reject = async (url: string, reason: RejectionReason, note: string, company?: string) => {
    if (!activeWorkspace) return;
    try {
      const res = await fetch(`/api/workspaces/${activeWorkspace.id}/triage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", url, reason, note, company }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        toast.error(j.error ?? "Erreur");
        return;
      }
      toast.success("Rejet enregistré");
      void load();
    } catch (err) {
      toast.error(`Erreur : ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const approve = async (url: string) => {
    if (!activeWorkspace) return;
    try {
      const res = await fetch(`/api/workspaces/${activeWorkspace.id}/triage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", url }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        toast.error(j.error ?? "Erreur");
        return;
      }
      toast.success("Marquée à évaluer");
      void load();
    } catch (err) {
      toast.error(`Erreur : ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const removeRejection = async (id: string) => {
    if (!activeWorkspace) return;
    const res = await fetch(`/api/workspaces/${activeWorkspace.id}/triage?rejectionId=${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      toast.success("Rejet retiré");
      void load();
    }
  };

  const refine = async () => {
    if (!activeWorkspace) return;
    setRefining(true);
    setProposal(null);
    setAcceptedChanges(new Set());
    try {
      const res = await fetch(`/api/workspaces/${activeWorkspace.id}/triage/refine`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Refinement impossible");
        return;
      }
      setProposal(json as Proposal);
      if ((json as Proposal).changes.length === 0) {
        toast.info((json as Proposal).summary);
      } else {
        setAcceptedChanges(new Set((json as Proposal).changes.map((_, i) => i)));
      }
    } catch (err) {
      toast.error(`Erreur : ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setRefining(false);
    }
  };

  const applyChanges = async () => {
    if (!activeWorkspace || !proposal) return;
    setApplying(true);
    try {
      const selected = proposal.changes.filter((_, i) => acceptedChanges.has(i));
      const res = await fetch(`/api/workspaces/${activeWorkspace.id}/triage/refine`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changes: selected }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Application impossible");
        return;
      }
      toast.success(`${selected.length} modification(s) appliquée(s) à portals.yml`);
      setProposal(null);
    } catch (err) {
      toast.error(`Erreur : ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setApplying(false);
    }
  };

  if (!activeWorkspace) {
    return (
      <PageShell title="Triage des annonces">
        <EmptyState icon={Filter} title="Aucun profil actif" description="Sélectionne un profil pour accéder au triage." />
      </PageShell>
    );
  }

  const pending = data?.pipeline.filter((p) => p.status === "pending") ?? [];
  const processed = (data?.pipeline.filter((p) => p.status === "processed") ?? []).slice(0, 50);
  const errored = data?.pipeline.filter((p) => p.status === "error") ?? [];
  const rejections = data?.feedback.rejections ?? [];

  const confirmConfig = (() => {
    if (confirmMode === "auto-light") {
      return {
        title: "Scan + évaluation rapide (économique) ?",
        description:
          "Claude scanne tes portails puis fait une évaluation LÉGÈRE de chaque offre : score + résumé de 2-3 phrases + recommandation. Aucun rapport détaillé, aucun CV adapté, aucune lettre. Compte 10-15 min total et consomme ~3-5× moins de tokens que « Tout automatiser ».",
        warnings: [
          `Idéal quand tu veux pré-filtrer beaucoup d'offres sans cramer ta limite Claude. Modèle utilisé : ${scanModel} (Haiku encore plus économique).`,
          "Une fois les évaluations rapides faites, tu pourras lancer le pipeline complet (`/career-ops <URL>` depuis Actions) seulement sur les offres qui t'intéressent.",
        ],
        cta: "Lancer l'éval rapide",
      };
    }
    return null;
  })();

  return (
    <PageShell
      title="Triage des annonces"
      description="Affine tes filtres en marquant ce qui te plaît ou pas. L'IA apprend de tes rejets."
      actions={
        <Button variant="outline" size="sm" onClick={() => void load()}>
          <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} /> Recharger
        </Button>
      }
    >
      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <Tabs defaultValue="inbox">
          <TabsList>
            <TabsTrigger value="inbox">
              Inbox ({pending.length})
            </TabsTrigger>
            <TabsTrigger value="processed">
              Récemment traitées ({processed.length})
            </TabsTrigger>
            <TabsTrigger value="rejections">Rejets ({rejections.length})</TabsTrigger>
            <TabsTrigger value="refine">
              <Sparkles className="mr-1 h-3 w-3" /> Affiner les filtres
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inbox" className="mt-6 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Radar className="h-4 w-4" /> Scanner les sites d'annonces
                </CardTitle>
                <CardDescription className="text-xs">
                  Cherche automatiquement de nouvelles offres dans les portails que tu as configurés.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-end gap-3">
                  <Button
                    onClick={() => setConfirmMode("auto-light")}
                    disabled={!!scanRunning}
                    variant="default"
                    size="lg"
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600"
                  >
                    {scanRunning === "auto-light" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Radar className="mr-2 h-4 w-4" />
                    )}
                    Scanner mes annonces
                  </Button>
                  <Button onClick={() => void scan("fast")} disabled={!!scanRunning} variant="ghost" size="sm">
                    {scanRunning === "fast" ? (
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    ) : (
                      <Zap className="mr-2 h-3 w-3" />
                    )}
                    Scan rapide seul (sans Claude)
                  </Button>
                  <ModelPicker value={scanModel} onChange={setScanModel} recommendedModel="sonnet" compact />
                </div>
                <Alert>
                  <Radar className="h-4 w-4" />
                  <AlertTitle className="text-xs">Workflow recommandé</AlertTitle>
                  <AlertDescription className="text-xs">
                    Le bouton vert ci-dessus lance le <strong>scan complet IA + une évaluation rapide</strong> de chaque offre trouvée
                    (score + résumé court, sans génération de CV ni lettre). Ensuite, va dans l'onglet « Récemment traitées »,
                    coche les offres qui t'intéressent et clique sur <strong>« Générer CV + lettre pour la sélection »</strong>.
                    Tu ne consommes des tokens lourds que sur les offres que tu valides.
                  </AlertDescription>
                </Alert>
                {scanLogs.length > 0 || scanRunning ? (
                  <ScanProgress
                    logs={scanLogs}
                    running={!!scanRunning}
                    finished={scanFinished}
                    title={
                      scanRunning === "fast"
                        ? "Scan rapide en cours…"
                        : scanRunning === "agent"
                          ? "Scan complet par Claude en cours…"
                          : scanRunning === "auto"
                            ? "Workflow automatique complet en cours (scan + évaluation)…"
                            : scanRunning === "auto-light"
                              ? "Scan + évaluation rapide (économique) en cours…"
                              : "Scan"
                    }
                  />
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Ajouter une offre à trier manuellement</CardTitle>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Input
                  placeholder="Colle une URL d'annonce (LinkedIn, France Travail…)"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newUrl.trim()) void addUrl();
                  }}
                />
                <Button onClick={addUrl} disabled={!newUrl.trim()}>
                  <Plus className="mr-2 h-4 w-4" /> Ajouter
                </Button>
              </CardContent>
            </Card>

            {pending.length === 0 ? (
              processed.length > 0 ? (
                <EmptyState
                  icon={Check}
                  title="Inbox vide — toutes les offres ont été traitées ✓"
                  description={`${processed.length} offre${processed.length > 1 ? "s" : ""} récemment scannée${processed.length > 1 ? "s" : ""} et évaluée${processed.length > 1 ? "s" : ""}. Va voir l'onglet « Récemment traitées » ci-dessus, ou « Candidatures » dans la sidebar pour les détails complets.`}
                />
              ) : (
                <EmptyState
                  icon={Inbox}
                  title="Inbox vide"
                  description="Lance un scan ci-dessus, ou ajoute une URL manuellement. Les offres trouvées s'afficheront ici prêtes à trier."
                />
              )
            ) : (
              <div className="space-y-2">
                {pending.map((p, i) => (
                  <PendingCard key={`${p.url}-${i}`} entry={p} onApprove={approve} onReject={reject} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="processed" className="mt-6 space-y-3">
            {processed.length === 0 ? (
              <EmptyState
                icon={Check}
                title="Aucune offre traitée pour l'instant"
                description="Lance un scan + évaluation pour faire travailler l'IA sur tes offres."
              />
            ) : (
              <>
                <Card className="border-emerald-500/40 bg-emerald-500/5">
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckSquare className="h-4 w-4 text-emerald-600" />
                      <span>
                        <strong>{selectedUrls.size}</strong> sélectionnée{selectedUrls.size > 1 ? "s" : ""} sur {processed.length}
                      </span>
                      {selectedUrls.size > 0 ? (
                        <button
                          type="button"
                          onClick={() => setSelectedUrls(new Set())}
                          className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                        >
                          Désélectionner
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelectedUrls(new Set(processed.map((p) => p.url)))}
                          className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                        >
                          Tout sélectionner
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <ModelPicker value={generateModel} onChange={setGenerateModel} recommendedModel="sonnet" compact />
                      <Button
                        size="sm"
                        onClick={() => setConfirmGenerate(true)}
                        disabled={selectedUrls.size === 0 || generating}
                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                      >
                        {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                        Générer CV + lettre ({selectedUrls.size})
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Alert>
                  <Check className="h-4 w-4" />
                  <AlertTitle>{processed.length} offre{processed.length > 1 ? "s" : ""} évaluée{processed.length > 1 ? "s" : ""}</AlertTitle>
                  <AlertDescription className="text-xs">
                    Coche les offres qui t'intéressent, puis lance la génération CV + lettre uniquement sur celles-là.
                    Tu économises 3-5× les tokens vs un pipeline complet sur tout.
                  </AlertDescription>
                </Alert>

                {generateLogs.length > 0 || generating ? (
                  <ScanProgress
                    logs={generateLogs}
                    running={generating}
                    finished={generateDone}
                    title={generating ? "Génération des CV + lettres en cours…" : "Génération terminée"}
                  />
                ) : null}

                {processed.map((p, i) => {
                  const selected = selectedUrls.has(p.url);
                  return (
                    <Card
                      key={`${p.url}-${i}`}
                      className={cn(
                        "cursor-pointer transition-colors",
                        selected ? "border-emerald-500 bg-emerald-500/5" : "hover:bg-accent/30"
                      )}
                      onClick={() => toggleSelect(p.url)}
                    >
                      <CardContent className="flex items-start gap-3 p-4">
                        <Checkbox
                          checked={selected}
                          onCheckedChange={() => toggleSelect(p.url)}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-0.5"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {p.score ? (
                              <Badge
                                variant="outline"
                                className={cn(
                                  "font-mono",
                                  parseFloat(p.score) >= 4
                                    ? "border-emerald-500 text-emerald-700 dark:text-emerald-300"
                                    : parseFloat(p.score) >= 3
                                      ? "border-blue-500 text-blue-700 dark:text-blue-300"
                                      : "border-red-500 text-red-700 dark:text-red-300"
                                )}
                              >
                                {p.score}
                              </Badge>
                            ) : null}
                            {p.company ? <span className="text-sm font-medium">{p.company}</span> : null}
                            {p.role ? <span className="text-xs text-muted-foreground">— {p.role}</span> : null}
                          </div>
                          <a
                            href={p.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground hover:underline"
                          >
                            <ExternalLink className="h-3 w-3 shrink-0" />
                            <span className="truncate">{p.url}</span>
                          </a>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {errored.length > 0 ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{errored.length} offre{errored.length > 1 ? "s" : ""} en erreur</AlertTitle>
                    <AlertDescription className="text-xs">
                      Ces URLs n'ont pas pu être analysées (souvent : page connexion requise, ou domaine bloqué). Tu peux les supprimer manuellement de <code>data/pipeline.md</code>.
                    </AlertDescription>
                  </Alert>
                ) : null}
              </>
            )}
          </TabsContent>

          <TabsContent value="rejections" className="mt-6 space-y-3">
            {rejections.length === 0 ? (
              <EmptyState
                icon={Filter}
                title="Aucun rejet pour le moment"
                description="Rejette des offres depuis l'onglet Inbox, elles s'accumuleront ici pour aider l'IA à affiner tes filtres."
              />
            ) : (
              rejections.map((r) => (
                <Card key={r.id}>
                  <CardContent className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive">
                          {REJECTION_REASONS.find((x) => x.id === r.reason)?.label ?? r.reason}
                        </Badge>
                        {r.company ? <span className="text-sm font-medium">{r.company}</span> : null}
                        <span className="text-xs text-muted-foreground">
                          {new Date(r.createdAt).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">{r.url}</p>
                      {r.note ? <p className="mt-1 text-xs italic">« {r.note} »</p> : null}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeRejection(r.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="refine" className="mt-6 space-y-4">
            <Alert>
              <Wand2 className="h-4 w-4" />
              <AlertTitle>Comment ça marche</AlertTitle>
              <AlertDescription className="text-xs">
                Claude lit tes rejets accumulés et ton portals.yml actuel, puis propose des règles de filtrage (mots-clés
                négatifs, villes à bloquer, salaire minimum…). Tu choisis lesquelles appliquer.
              </AlertDescription>
            </Alert>

            <Button onClick={refine} disabled={refining || rejections.length === 0}>
              {refining ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyse en cours…
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" /> Analyser mes rejets
                </>
              )}
            </Button>

            {rejections.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Tu n'as encore rejeté aucune offre. Commence par trier quelques annonces dans l'Inbox.
                </AlertDescription>
              </Alert>
            ) : null}

            {proposal ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Proposition de l'IA</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{proposal.summary}</p>
                  {proposal.changes.length === 0 ? null : (
                    <ScrollArea className="max-h-[420px]">
                      <div className="space-y-2">
                        {proposal.changes.map((c, i) => {
                          const checked = acceptedChanges.has(i);
                          return (
                            <label
                              key={i}
                              className={cn(
                                "flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors",
                                checked ? "border-primary bg-primary/5" : "hover:bg-accent/30"
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  setAcceptedChanges((prev) => {
                                    const next = new Set(prev);
                                    if (e.target.checked) next.add(i);
                                    else next.delete(i);
                                    return next;
                                  });
                                }}
                                className="mt-0.5"
                              />
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2 text-xs">
                                  <Badge variant="outline" className="font-mono">
                                    {c.action}
                                  </Badge>
                                  <code className="text-muted-foreground">{c.field}</code>
                                </div>
                                <p className="font-mono text-xs">{JSON.stringify(c.value)}</p>
                                <p className="text-xs text-muted-foreground">{c.reason}</p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  )}
                  {proposal.changes.length > 0 ? (
                    <div className="flex gap-2">
                      <Button onClick={applyChanges} disabled={applying || acceptedChanges.size === 0}>
                        {applying ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="mr-2 h-4 w-4" />
                        )}
                        Appliquer ({acceptedChanges.size})
                      </Button>
                      <Button variant="ghost" onClick={() => setProposal(null)}>
                        Annuler
                      </Button>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={confirmGenerate} onOpenChange={setConfirmGenerate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600" />
              Générer CV + lettre pour {selectedUrls.size} offre{selectedUrls.size > 1 ? "s" : ""} ?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Claude va lancer le pipeline complet sur les {selectedUrls.size} offre{selectedUrls.size > 1 ? "s" : ""} sélectionnée{selectedUrls.size > 1 ? "s" : ""} : évaluation détaillée A-F, CV ATS adapté avec mots-clés du JD, lettre de motivation, plan d'entretien STAR.
            </p>
            <ul className="space-y-1.5 rounded-md border bg-muted/30 p-3">
              <li className="flex items-start gap-2 text-xs">
                <AlertCircle className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />
                <span>Compte ~3-5 min par offre, en arrière-plan (modèle : {generateModel}).</span>
              </li>
              <li className="flex items-start gap-2 text-xs">
                <AlertCircle className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />
                <span>Une fois fini, tu retrouves les CV dans <strong>Documents</strong> et l'analyse dans <strong>Candidatures</strong>.</span>
              </li>
            </ul>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setConfirmGenerate(false)}>
              Annuler
            </Button>
            <Button onClick={() => void generateDocs()} className="bg-emerald-600 text-white hover:bg-emerald-700">
              Lancer la génération
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmMode !== null} onOpenChange={(o) => !o && setConfirmMode(null)}>
        <DialogContent className="sm:max-w-md">
          {confirmConfig ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {confirmMode === "auto" ? (
                    <Wand2 className="h-5 w-5 text-indigo-500" />
                  ) : (
                    <Sparkles className="h-5 w-5 text-amber-500" />
                  )}
                  {confirmConfig.title}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <p className="text-sm text-muted-foreground">{confirmConfig.description}</p>
                <ul className="space-y-1.5 rounded-md border bg-muted/30 p-3">
                  {confirmConfig.warnings.map((w, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs">
                      <AlertCircle className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="ghost" onClick={() => setConfirmMode(null)}>
                  Annuler
                </Button>
                <Button
                  onClick={() => {
                    const m = confirmMode;
                    setConfirmMode(null);
                    if (m) void scan(m);
                  }}
                >
                  {confirmConfig.cta}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

function PendingCard({
  entry,
  onApprove,
  onReject,
}: {
  entry: PipelineEntry;
  onApprove: (url: string) => void;
  onReject: (url: string, reason: RejectionReason, note: string, company?: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState<RejectionReason>("mauvais-metier");
  const [note, setNote] = React.useState("");

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 p-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-normal">
              {entry.company ?? "—"}
            </Badge>
            {entry.role ? <span className="text-sm">{entry.role}</span> : null}
          </div>
          <a
            href={entry.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground hover:underline"
          >
            <ExternalLink className="h-3 w-3 shrink-0" />
            <span className="truncate">{entry.url}</span>
          </a>
        </div>
        <div className="flex gap-1.5">
          <Button size="sm" variant="outline" onClick={() => onApprove(entry.url)}>
            <Check className="mr-1 h-3 w-3 text-emerald-500" /> Garder
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button size="sm" variant="ghost" />}>
              <X className="mr-1 h-3 w-3 text-red-500" /> Rejeter
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Pourquoi rejettes-tu cette offre ?</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div className="flex flex-wrap gap-2">
                  {REJECTION_REASONS.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setReason(r.id)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-sm transition-colors",
                        reason === r.id
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background hover:bg-accent"
                      )}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rej-note" className="text-xs">
                    Note (optionnelle)
                  </Label>
                  <Textarea
                    id="rej-note"
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Précise ce qui ne te convient pas pour aider l'IA à affiner les filtres."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>
                  Annuler
                </Button>
                <Button
                  onClick={() => {
                    onReject(entry.url, reason, note, entry.company);
                    setOpen(false);
                  }}
                >
                  Enregistrer le rejet
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
