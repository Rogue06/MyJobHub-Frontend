"use client";

import * as React from "react";
import { ChevronDown, ChevronUp, Lightbulb, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { LogViewer, LogEvent } from "@/components/log-viewer";
import { JOB_SEARCH_TIPS } from "@/lib/tips";
import { cn } from "@/lib/utils";

interface Props {
  logs: LogEvent[];
  running: boolean;
  finished: boolean;
  title?: string;
}

export function ScanProgress({ logs, running, finished, title = "Travail en cours" }: Props) {
  const [elapsed, setElapsed] = React.useState(0);
  const [showLogs, setShowLogs] = React.useState(false);
  const [tipIndex, setTipIndex] = React.useState(0);
  const startRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (running) {
      if (startRef.current === null) startRef.current = Date.now();
      const id = setInterval(() => {
        if (startRef.current !== null) {
          setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
        }
      }, 1000);
      return () => clearInterval(id);
    }
    if (!running && !finished) startRef.current = null;
  }, [running, finished]);

  React.useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setTipIndex((i) => (i + 1) % JOB_SEARCH_TIPS.length);
    }, 9000);
    return () => clearInterval(id);
  }, [running]);

  const currentStep = React.useMemo(() => {
    for (let i = logs.length - 1; i >= 0; i--) {
      if (logs[i].type === "step") return logs[i].message;
    }
    return null;
  }, [logs]);

  const lastLog = React.useMemo(() => {
    for (let i = logs.length - 1; i >= 0; i--) {
      const l = logs[i];
      if (l.type === "log" || l.type === "info") return l.message;
    }
    return null;
  }, [logs]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m} min ${sec.toString().padStart(2, "0")} s` : `${sec} s`;
  };

  const tip = JOB_SEARCH_TIPS[tipIndex];

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div
        className={cn(
          "flex items-center gap-3 border-b px-4 py-3",
          finished && !running
            ? "bg-emerald-500/5"
            : running
              ? "bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-indigo-500/5"
              : "bg-muted/30"
        )}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background shadow-sm">
          {running ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : finished ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          ) : (
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {finished && !running ? "Terminé" : running ? currentStep ?? title : "En attente"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {running
              ? lastLog ?? "Initialisation…"
              : finished
                ? "L'opération est terminée, tu peux consulter les résultats ci-dessous."
                : "—"}
          </p>
        </div>
        <div className="shrink-0 rounded-md bg-background px-2 py-1 font-mono text-xs text-muted-foreground tabular-nums">
          {formatTime(elapsed)}
        </div>
      </div>

      <div className="space-y-3 px-4 py-3">
        {running ? (
          <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium uppercase tracking-wide text-amber-700 dark:text-amber-300">
                Astuce
              </p>
              <p className="mt-0.5 text-sm leading-snug">{tip}</p>
            </div>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setShowLogs((v) => !v)}
          className="flex w-full items-center justify-between rounded-md bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted"
        >
          <span>
            {showLogs ? "Masquer" : "Voir"} le détail technique ({logs.length} log{logs.length > 1 ? "s" : ""})
          </span>
          {showLogs ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
        {showLogs ? <LogViewer logs={logs} height={240} /> : null}
      </div>
    </div>
  );
}
