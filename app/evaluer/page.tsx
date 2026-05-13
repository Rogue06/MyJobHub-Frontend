"use client";

import * as React from "react";
import { Send, Loader2, Play, Link as LinkIcon, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { LogViewer, LogEvent, consumeSseStream } from "@/components/log-viewer";

export default function EvaluerPage() {
  const { activeWorkspace } = useWorkspace();
  const [content, setContent] = React.useState("");
  const [running, setRunning] = React.useState(false);
  const [logs, setLogs] = React.useState<LogEvent[]>([]);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (!activeWorkspace) {
    return (
      <PageShell title="Évaluer une offre">
        <EmptyState
          icon={Send}
          title="Aucun profil actif"
          description="Sélectionne un profil avant d'évaluer une offre."
        />
      </PageShell>
    );
  }

  const isUrl = /^https?:\/\//i.test(content.trim());

  const start = async () => {
    if (content.trim().length < 10) {
      toast.error("Colle une URL ou un texte d'offre (au moins 10 caractères).");
      return;
    }
    setRunning(true);
    setDone(false);
    setError(null);
    setLogs([]);

    try {
      const res = await fetch(`/api/workspaces/${activeWorkspace.id}/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "Le serveur n'a pas pu démarrer l'évaluation.");
        return;
      }
      await consumeSseStream(res, (evt) => {
        setLogs((prev) => [...prev, evt]);
        if (evt.type === "done") setDone(true);
        if (evt.type === "error") setError(evt.message);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
    }
  };

  return (
    <PageShell
      title="Évaluer une offre"
      description="Colle une URL d'annonce ou le texte de l'offre. Claude l'analyse selon ton profil et te donne un score."
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="offer">Offre à évaluer</Label>
            <Textarea
              id="offer"
              rows={10}
              placeholder="Colle ici l'URL de l'annonce (LinkedIn, France Travail, etc.) ou le texte complet du poste…"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={running}
              className="text-sm"
            />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {content.trim().length === 0 ? (
                <>
                  <FileText className="h-3 w-3" /> URL ou texte accepté
                </>
              ) : isUrl ? (
                <>
                  <LinkIcon className="h-3 w-3" /> URL détectée
                </>
              ) : (
                <>
                  <FileText className="h-3 w-3" /> Texte d'offre ({content.trim().length} caractères)
                </>
              )}
            </div>
          </div>

          <Alert>
            <AlertTitle>Ce qui se passe ensuite</AlertTitle>
            <AlertDescription className="text-xs">
              Claude lit l'annonce, la compare à ton CV, génère un score A-F sur 10 critères, propose un CV
              adapté et une lettre de motivation. Tout est sauvegardé dans le dossier <code>output/</code> et{" "}
              <code>reports/</code> de ton profil.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button onClick={start} disabled={running || content.trim().length < 10}>
              {running ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Évaluation en cours…
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" /> Lancer l'évaluation
                </>
              )}
            </Button>
            <Button variant="ghost" disabled={running} onClick={() => setContent("")}>
              Effacer
            </Button>
          </div>

          {error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {done && !error ? (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Évaluation terminée</AlertTitle>
              <AlertDescription>
                Va voir l'onglet <strong>Candidatures</strong> ou <strong>Documents</strong> pour récupérer le résultat.
              </AlertDescription>
            </Alert>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label>Suivi en direct</Label>
          <LogViewer logs={logs} height={520} empty="Les logs de Claude s'afficheront ici quand tu lanceras l'évaluation." />
        </div>
      </div>
    </PageShell>
  );
}
