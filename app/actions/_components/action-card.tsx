"use client";

import * as React from "react";
import * as Icons from "lucide-react";
import { Loader2, Play, AlertTriangle, Info, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import { ScanProgress } from "@/components/scan-progress";
import { LogEvent, consumeSseStream } from "@/components/log-viewer";
import { ModelPicker, useModelPreference } from "@/components/forms/model-picker";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { ActionDefinition } from "@/lib/actions-catalog";
import { CATEGORY_STYLES } from "@/lib/action-styles";
import { cn } from "@/lib/utils";

interface Props {
  action: ActionDefinition;
}

export function ActionCard({ action }: Props) {
  const { activeWorkspace } = useWorkspace();
  const [args, setArgs] = React.useState("");
  const [running, setRunning] = React.useState(false);
  const [finished, setFinished] = React.useState(false);
  const [logs, setLogs] = React.useState<LogEvent[]>([]);
  const [open, setOpen] = React.useState(false);
  const [model, setModel] = useModelPreference(`myjobhub-model-action-${action.id}`);

  const Icon = (Icons as unknown as Record<string, React.ElementType>)[action.iconName] ?? Icons.Sparkles;
  const style = CATEGORY_STYLES[action.category];

  const start = async () => {
    if (!activeWorkspace) {
      toast.error("Sélectionne un profil d'abord.");
      return;
    }
    if (action.argsRequired && args.trim().length === 0) {
      toast.error("Cette action requiert un argument.");
      return;
    }
    setRunning(true);
    setFinished(false);
    setLogs([]);
    setOpen(true);
    try {
      const res = await fetch(`/api/workspaces/${activeWorkspace.id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionId: action.id,
          args: args.trim() || undefined,
          model: action.usesClaudeModel ? model : undefined,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        toast.error(j.error ?? "Démarrage impossible");
        return;
      }
      await consumeSseStream(res, (evt) => {
        setLogs((prev) => [...prev, evt]);
        if (evt.type === "error") toast.error(evt.message);
        if (evt.type === "done") setFinished(true);
        if (evt.type === "success") toast.success(evt.message);
      });
    } catch (err) {
      toast.error(`Erreur : ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setRunning(false);
    }
  };

  const hasArgsField = action.argsPlaceholder !== undefined;

  return (
    <Card
      className={cn(
        "flex h-full flex-col ring-1 ring-transparent transition-shadow",
        style.ring
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", style.iconBg)}>
            <Icon className={cn("h-5 w-5", style.iconText)} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <CardTitle className="text-sm leading-tight">{action.title}</CardTitle>
              <Tooltip content={`Cette action lance "${action.kind === "slash" ? "/career-ops " + action.command : "npm run " + action.command}" dans le dossier de ton profil. ${action.description}`}>
                <Info className="h-3 w-3 cursor-help text-muted-foreground/60" />
              </Tooltip>
            </div>
            <CardDescription className="mt-1 text-xs">{action.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <Badge variant="outline" className={cn("self-start font-mono text-[10px] font-normal", style.badgeBg, "border-transparent")}>
          {action.kind === "slash" ? `/career-ops ${action.command}` : `npm run ${action.command}`}
        </Badge>

        {hasArgsField ? (
          <div className="space-y-1">
            <Label className="flex items-center gap-1.5 text-xs">
              Arguments {action.argsRequired ? <span className="text-destructive">*</span> : <span className="text-muted-foreground">(optionnel)</span>}
            </Label>
            {action.argsMultiline ? (
              <Textarea
                placeholder={action.argsPlaceholder}
                value={args}
                onChange={(e) => setArgs(e.target.value)}
                rows={3}
                disabled={running}
                className="text-xs"
              />
            ) : (
              <Input
                placeholder={action.argsPlaceholder}
                value={args}
                onChange={(e) => setArgs(e.target.value)}
                disabled={running}
                className="text-xs"
              />
            )}
            {action.argsHint ? <p className="text-[11px] text-muted-foreground">{action.argsHint}</p> : null}
          </div>
        ) : null}

        {action.warning ? (
          <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-xs text-amber-800 dark:text-amber-300">
            <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
            <span>{action.warning}</span>
          </div>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
          <Button size="sm" onClick={start} disabled={running}>
            {running ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Play className="mr-2 h-3.5 w-3.5" />}
            Lancer
          </Button>
          {action.usesClaudeModel ? (
            <Tooltip content="Choisis le modèle Claude utilisé pour cette commande. Opus est le plus puissant mais consomme plus, Haiku est rapide et économique.">
              <ModelPicker value={model} onChange={setModel} compact />
            </Tooltip>
          ) : null}
          {open ? (
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)} disabled={running} className="ml-auto">
              <X className="h-3 w-3" />
            </Button>
          ) : null}
        </div>

        {open && (logs.length > 0 || running) ? (
          <ScanProgress
            logs={logs}
            running={running}
            finished={finished}
            title={`Exécution de ${action.title}`}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
