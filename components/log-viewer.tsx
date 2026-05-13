"use client";

import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export interface LogEvent {
  type: "info" | "log" | "warn" | "error" | "success" | "step" | "done";
  message: string;
}

interface Props {
  logs: LogEvent[];
  height?: number | string;
  empty?: string;
}

export function LogViewer({ logs, height = 360, empty = "Les logs apparaîtront ici en temps réel." }: Props) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs.length]);

  return (
    <ScrollArea
      className="rounded-md border bg-black/90 text-green-100"
      style={{ height: typeof height === "number" ? `${height}px` : height }}
    >
      <div ref={ref} className="space-y-1 p-3 font-mono text-xs">
        {logs.length === 0 ? (
          <p className="text-zinc-500">{empty}</p>
        ) : (
          logs.map((l, i) => (
            <div key={i} className={cn(colorFor(l.type))}>
              {iconFor(l.type)} {l.message}
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  );
}

function colorFor(t: LogEvent["type"]): string {
  switch (t) {
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

function iconFor(t: LogEvent["type"]): string {
  switch (t) {
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

export async function consumeSseStream(
  res: Response,
  onEvent: (evt: LogEvent) => void
): Promise<void> {
  if (!res.body) throw new Error("Pas de flux reçu du serveur");
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";
    for (const chunk of chunks) {
      const line = chunk.trim();
      if (!line.startsWith("data:")) continue;
      try {
        const evt = JSON.parse(line.slice(5).trim()) as LogEvent;
        onEvent(evt);
      } catch {
        onEvent({ type: "log", message: line.slice(5).trim() });
      }
    }
  }
}
