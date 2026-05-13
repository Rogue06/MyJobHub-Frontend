"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, AlertCircle, Loader2, Play, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { WizardStepCard } from "./wizard-layout";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { WizardDraft, clearDraft } from "../_lib/wizard-types";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { cn } from "@/lib/utils";

interface Props {
  draft: WizardDraft;
  setDraft: React.Dispatch<React.SetStateAction<WizardDraft>>;
  onBack: () => void;
}

type LogEntry = {
  type: "info" | "log" | "warn" | "error" | "success" | "step" | "done";
  message: string;
  at: number;
};

export function Step6Provision({ draft, setDraft, onBack }: Props) {
  const router = useRouter();
  const { refresh } = useWorkspace();
  const [running, setRunning] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [logs, setLogs] = React.useState<LogEntry[]>([]);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const appendLog = (entry: LogEntry) => {
    setLogs((prev) => [...prev, entry]);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    });
  };

  const start = async () => {
    setRunning(true);
    setDone(false);
    setError(null);
    setLogs([]);

    try {
      const createRes = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: draft.name, parentDir: draft.parentDir }),
      });
      const createJson = await createRes.json();
      if (!createRes.ok) {
        setError(createJson.error ?? "Impossible de créer le profil.");
        appendLog({ type: "error", message: createJson.error ?? "Erreur", at: Date.now() });
        setRunning(false);
        return;
      }
      const workspaceId = createJson.workspace.id as string;
      setDraft((d) => ({ ...d, createdWorkspaceId: workspaceId }));
      appendLog({ type: "info", message: `Profil créé (id ${workspaceId})`, at: Date.now() });

      const res = await fetch("/api/wizard/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          cvMarkdown: draft.cvMarkdown,
          profileYaml: draft.profileYaml,
          preferences: draft.preferences,
          enabledSources: draft.enabledSources,
        }),
      });

      if (!res.ok || !res.body) {
        setError("Le serveur n'a pas pu démarrer le provisionnement.");
        setRunning(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done: streamDone } = await reader.read();
        if (streamDone) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";
        for (const chunk of lines) {
          const line = chunk.trim();
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          try {
            const evt = JSON.parse(payload) as LogEntry;
            appendLog({ ...evt, at: Date.now() });
            if (evt.type === "done") {
              setDone(true);
              await refresh();
            }
            if (evt.type === "error") {
              setError(evt.message);
            }
          } catch {
            appendLog({ type: "log", message: payload, at: Date.now() });
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      appendLog({ type: "error", message: err instanceof Error ? err.message : String(err), at: Date.now() });
    } finally {
      setRunning(false);
    }
  };

  const finish = () => {
    clearDraft();
    toast.success("Profil prêt ! Tu peux commencer à évaluer des offres.");
    router.push("/");
  };

  return (
    <WizardStepCard
      title="Installation et configuration"
      description="On clone career-ops, on installe les dépendances et on écrit ta configuration. Cela prend en général 2 à 4 minutes."
      footer={
        <>
          <Button variant="ghost" onClick={onBack} disabled={running}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Retour
          </Button>
          {!running && !done ? (
            <Button onClick={start}>
              <Play className="mr-2 h-4 w-4" /> Démarrer l'installation
            </Button>
          ) : null}
          {done ? (
            <Button onClick={finish}>
              <Sparkles className="mr-2 h-4 w-4" /> Aller au tableau de bord
            </Button>
          ) : null}
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-md border bg-muted/30 p-4 text-sm">
          <p className="font-medium">Récapitulatif</p>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            <li>
              <strong>Profil :</strong> {draft.name}
            </li>
            <li>
              <strong>Dossier :</strong> <span className="font-mono">{draft.parentDir}</span>
            </li>
            <li>
              <strong>Contrats :</strong> {draft.preferences.contractTypes.join(", ")}
            </li>
            <li>
              <strong>Domaines :</strong> {draft.preferences.domains.length + draft.preferences.customDomains.length}
            </li>
            <li>
              <strong>Sources actives :</strong> {draft.enabledSources.length}
            </li>
            <li>
              <strong>Rémunération :</strong> {draft.preferences.salaryMin.toLocaleString("fr-FR")} € → {draft.preferences.salaryTarget.toLocaleString("fr-FR")} €
            </li>
          </ul>
        </div>

        {logs.length > 0 ? (
          <ScrollArea className="h-[320px] rounded-md border bg-black/90 text-green-100" ref={scrollRef as React.RefObject<HTMLDivElement>}>
            <div className="space-y-1 p-4 font-mono text-xs">
              {logs.map((l, i) => (
                <div key={i} className={cn(logColor(l.type))}>
                  {logIcon(l.type)} {l.message}
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="rounded-md border border-dashed bg-muted/10 p-8 text-center text-sm text-muted-foreground">
            <p>Clique sur « Démarrer l'installation » pour lancer la mise en place.</p>
          </div>
        )}

        {error ? (
          <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">Une erreur est survenue</p>
              <p className="mt-1 text-xs">{error}</p>
            </div>
          </div>
        ) : null}

        {done ? (
          <div className="flex items-start gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">Profil prêt à l'emploi</p>
              <p className="mt-1 text-xs text-emerald-700/80 dark:text-emerald-400/80">
                Tu peux maintenant aller au tableau de bord et lancer ta première évaluation.
              </p>
            </div>
          </div>
        ) : null}

        {running ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> Installation en cours, ne ferme pas la page.
          </div>
        ) : null}
      </div>
    </WizardStepCard>
  );
}

function logColor(type: LogEntry["type"]): string {
  switch (type) {
    case "error":
      return "text-red-300";
    case "warn":
      return "text-amber-300";
    case "success":
    case "done":
      return "text-emerald-300";
    case "step":
      return "text-blue-300 font-semibold";
    case "info":
      return "text-sky-200";
    default:
      return "text-zinc-300";
  }
}

function logIcon(type: LogEntry["type"]): string {
  switch (type) {
    case "error":
      return "✕";
    case "warn":
      return "⚠";
    case "success":
    case "done":
      return "✓";
    case "step":
      return "▶";
    case "info":
      return "ℹ";
    default:
      return "›";
  }
}
