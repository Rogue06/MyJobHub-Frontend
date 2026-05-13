"use client";

import * as React from "react";
import {
  ChevronLeft,
  Folder,
  FolderOpen,
  Home,
  Loader2,
  CheckCircle2,
  ArrowUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DirEntry {
  name: string;
  path: string;
  isCareerOps: boolean;
}

interface ListResponse {
  currentPath: string;
  parentPath: string | null;
  home: string;
  entries: DirEntry[];
  error?: string;
}

interface Props {
  onSelect: (selectedPath: string) => void;
  initialPath?: string;
}

export function FolderBrowser({ onSelect, initialPath }: Props) {
  const [currentPath, setCurrentPath] = React.useState(initialPath ?? "~");
  const [data, setData] = React.useState<ListResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async (target: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/fs/list?path=${encodeURIComponent(target)}`);
      const json = (await res.json()) as ListResponse;
      if (json.error) {
        setError(json.error);
        return;
      }
      setData(json);
      setCurrentPath(json.currentPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load(currentPath);
  }, [load, currentPath]);

  const goHome = () => load("~");
  const goUp = () => data?.parentPath && load(data.parentPath);

  return (
    <div className="space-y-3 rounded-md border bg-card">
      <div className="flex items-center gap-1 border-b bg-muted/40 px-2 py-1.5">
        <Button size="sm" variant="ghost" onClick={goHome} aria-label="Aller au dossier personnel">
          <Home className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={goUp}
          disabled={!data?.parentPath}
          aria-label="Dossier parent"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
        <div className="ml-2 flex-1 truncate font-mono text-xs text-muted-foreground">
          {data?.currentPath ?? currentPath}
        </div>
      </div>
      {error ? (
        <p className="px-3 py-4 text-sm text-destructive">{error}</p>
      ) : (
        <ScrollArea className="h-[280px] px-1 pb-1">
          {loading && !data ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : data?.entries.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">Aucun sous-dossier ici.</p>
          ) : (
            <ul className="space-y-0.5">
              {data?.entries.map((e) => (
                <li key={e.path}>
                  <button
                    type="button"
                    onClick={() => load(e.path)}
                    className={cn(
                      "group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent"
                    )}
                  >
                    {e.isCareerOps ? (
                      <FolderOpen className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Folder className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="flex-1 truncate">{e.name}</span>
                    {e.isCareerOps ? (
                      <Badge variant="secondary" className="gap-1 text-[10px]">
                        <CheckCircle2 className="h-3 w-3" /> career-ops
                      </Badge>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      )}
      <div className="flex items-center justify-between gap-2 border-t bg-muted/30 px-3 py-2">
        <p className="truncate text-xs text-muted-foreground">
          Clique sur un dossier pour y entrer.
        </p>
        <Button
          size="sm"
          onClick={() => data?.currentPath && onSelect(data.currentPath)}
          disabled={!data?.currentPath}
        >
          <ChevronLeft className="mr-1 h-3 w-3 rotate-180" /> Choisir ce dossier
        </Button>
      </div>
    </div>
  );
}
