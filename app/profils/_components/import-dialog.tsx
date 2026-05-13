"use client";

import * as React from "react";
import {
  Download,
  FolderInput,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FolderSearch,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { FolderBrowser } from "./folder-browser";
import { cn } from "@/lib/utils";

interface CheckResult {
  ok: boolean;
  layout: "nested" | "flat" | "none";
  resolvedWorkspacePath: string | null;
  careerOpsRelPath: string | null;
  details: {
    hasModes: boolean;
    hasPackageJson: boolean;
    hasCv: boolean;
    hasProfile: boolean;
    hasPortals: boolean;
    hasNodeModules: boolean;
  };
  warnings: string[];
  error?: string;
}

interface CareerOpsMatch {
  path: string;
  parent: string;
  name: string;
  layout: "flat";
  hasCv: boolean;
  hasProfile: boolean;
  hasPortals: boolean;
  hasNodeModules: boolean;
}

export function ImportProfileDialog() {
  const { refresh } = useWorkspace();
  const [open, setOpen] = React.useState(false);
  const [tab, setTab] = React.useState<"auto" | "browse" | "manual">("auto");

  const [name, setName] = React.useState("");
  const [pathInput, setPathInput] = React.useState("");
  const [checking, setChecking] = React.useState(false);
  const [importing, setImporting] = React.useState(false);
  const [result, setResult] = React.useState<CheckResult | null>(null);

  const [scanLoading, setScanLoading] = React.useState(false);
  const [matches, setMatches] = React.useState<CareerOpsMatch[]>([]);
  const [scanned, setScanned] = React.useState(false);

  const reset = () => {
    setName("");
    setPathInput("");
    setResult(null);
    setMatches([]);
    setScanned(false);
    setTab("auto");
  };

  React.useEffect(() => {
    if (open && !scanned && !scanLoading) {
      void scan();
    }
  }, [open, scanned, scanLoading]);

  const scan = async () => {
    setScanLoading(true);
    try {
      const res = await fetch("/api/fs/scan");
      const json = await res.json();
      setMatches(json.matches ?? []);
      setScanned(true);
    } catch (err) {
      toast.error(`Erreur de scan : ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setScanLoading(false);
    }
  };

  const check = async (rawPath: string) => {
    if (!rawPath.trim()) return;
    setPathInput(rawPath);
    setChecking(true);
    setResult(null);
    try {
      const res = await fetch(`/api/workspaces/import?path=${encodeURIComponent(rawPath.trim())}`);
      const json = (await res.json()) as CheckResult;
      setResult(json);
      if (json.ok && !name.trim()) {
        const folderName =
          json.careerOpsRelPath === "."
            ? json.resolvedWorkspacePath?.split("/").filter(Boolean).slice(-1)[0]
            : rawPath.split("/").filter(Boolean).slice(-1)[0];
        if (folderName) setName(formatName(folderName));
      }
    } catch (err) {
      toast.error(`Erreur : ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setChecking(false);
    }
  };

  const submit = async () => {
    if (!result?.ok || !name.trim()) return;
    setImporting(true);
    try {
      const res = await fetch("/api/workspaces/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), path: pathInput.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Import impossible");
        return;
      }
      toast.success(
        `Profil "${name.trim()}" importé.` +
          (json.warnings?.length ? ` Avertissements : ${json.warnings.join(", ")}` : "")
      );
      await refresh();
      setOpen(false);
      reset();
    } catch (err) {
      toast.error(`Erreur : ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <FolderInput className="mr-2 h-4 w-4" /> Importer un profil existant
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importer un profil career-ops existant</DialogTitle>
          <DialogDescription>
            On scanne tes dossiers habituels pour trouver tes profils, ou tu peux parcourir manuellement.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList className="w-full">
            <TabsTrigger value="auto" className="flex-1">
              <Sparkles className="mr-2 h-3 w-3" /> Détection auto
            </TabsTrigger>
            <TabsTrigger value="browse" className="flex-1">
              <FolderSearch className="mr-2 h-3 w-3" /> Parcourir
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex-1">
              <FolderInput className="mr-2 h-3 w-3" /> Coller le chemin
            </TabsTrigger>
          </TabsList>

          <TabsContent value="auto" className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Scan de <code>~/Desktop</code>, <code>~/Documents</code>, <code>~/Downloads</code>
              </p>
              <Button size="sm" variant="ghost" onClick={scan} disabled={scanLoading}>
                <RefreshCw className={cn("mr-2 h-3 w-3", scanLoading && "animate-spin")} /> Re-scanner
              </Button>
            </div>
            {scanLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : matches.length === 0 ? (
              <Card>
                <CardContent className="py-6 text-center text-sm text-muted-foreground">
                  Aucun dossier career-ops trouvé automatiquement.
                  <br />
                  Utilise l'onglet « Parcourir » ou « Coller le chemin ».
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {matches.map((m) => (
                  <Card
                    key={m.path}
                    className="cursor-pointer transition-colors hover:bg-accent/40"
                    onClick={() => {
                      void check(m.path);
                      setTab("manual");
                    }}
                  >
                    <CardContent className="flex items-start gap-3 p-3">
                      <CheckCircle2 className="mt-1 h-4 w-4 text-emerald-500" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{m.name}</p>
                        <p className="truncate font-mono text-[10px] text-muted-foreground">{m.path}</p>
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {m.hasCv ? <Badge variant="outline" className="text-[10px]">cv.md</Badge> : null}
                          {m.hasProfile ? (
                            <Badge variant="outline" className="text-[10px]">profile.yml</Badge>
                          ) : null}
                          {m.hasPortals ? (
                            <Badge variant="outline" className="text-[10px]">portals.yml</Badge>
                          ) : null}
                          {m.hasNodeModules ? (
                            <Badge variant="secondary" className="text-[10px]">installé</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-amber-600 dark:text-amber-400">
                              npm install requis
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="browse" className="mt-4 space-y-3">
            <FolderBrowser
              onSelect={(p) => {
                void check(p);
                setTab("manual");
              }}
              initialPath={pathInput || "~"}
            />
            <p className="text-xs text-muted-foreground">
              Astuce : depuis le Finder, tu peux glisser un dossier dans le champ « Coller le chemin » pour récupérer son chemin.
            </p>
          </TabsContent>

          <TabsContent value="manual" className="mt-4 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="import-path">Chemin du dossier</Label>
              <div className="flex gap-2">
                <Input
                  id="import-path"
                  placeholder="Ex. /Users/rogue/Desktop/career-ops-alternance"
                  value={pathInput}
                  onChange={(e) => setPathInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && pathInput.trim()) {
                      e.preventDefault();
                      void check(pathInput);
                    }
                  }}
                  className="font-mono text-xs"
                />
                <Button
                  onClick={() => check(pathInput)}
                  disabled={!pathInput.trim() || checking}
                  variant="outline"
                >
                  {checking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Vérifier
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Sur Mac : depuis le Finder, fais clic droit sur le dossier &gt; Options (⌥) &gt; « Copier "X" comme nom de chemin », puis colle ici.
              </p>
            </div>

            {result ? <ResultPanel result={result} /> : null}

            {result?.ok ? (
              <div className="space-y-1.5">
                <Label htmlFor="import-name">Nom du profil</Label>
                <Input
                  id="import-name"
                  placeholder="Ex. Alternance ES Bank"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            ) : null}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={importing}>
            Annuler
          </Button>
          <Button onClick={submit} disabled={!result?.ok || !name.trim() || importing}>
            {importing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Importer ce profil
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResultPanel({ result }: { result: CheckResult }) {
  if (!result.ok) {
    return (
      <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
        <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <p className="text-xs">{result.error ?? "Dossier invalide."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-md border bg-muted/30 p-3 text-sm">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        <span className="text-sm font-medium">Career-ops détecté</span>
        <Badge variant="secondary" className="ml-auto">
          {result.layout === "flat" ? "Structure directe" : "Structure imbriquée"}
        </Badge>
      </div>
      <ul className="space-y-1 text-xs">
        <FileLine label="modes/" present={result.details.hasModes} />
        <FileLine label="package.json" present={result.details.hasPackageJson} />
        <FileLine label="cv.md" present={result.details.hasCv} />
        <FileLine label="config/profile.yml" present={result.details.hasProfile} />
        <FileLine label="portals.yml" present={result.details.hasPortals} />
        <FileLine label="node_modules" present={result.details.hasNodeModules} optional />
      </ul>
      {result.warnings.length > 0 ? (
        <div className="flex items-start gap-2 rounded border-amber-500/40 bg-amber-500/10 p-2 text-xs text-amber-800 dark:text-amber-300">
          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
          <span>Avertissements : {result.warnings.join(", ")}</span>
        </div>
      ) : null}
    </div>
  );
}

function FileLine({ label, present, optional }: { label: string; present: boolean; optional?: boolean }) {
  return (
    <li className="flex items-center gap-2 font-mono">
      <span
        className={cn(
          "inline-block h-2 w-2 rounded-full",
          present ? "bg-emerald-500" : optional ? "bg-amber-400" : "bg-red-500"
        )}
      />
      <span className={present ? "" : "text-muted-foreground"}>{label}</span>
      {!present ? <span className="text-muted-foreground">{optional ? "(optionnel)" : "(manquant)"}</span> : null}
    </li>
  );
}

function formatName(folderName: string): string {
  return folderName.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
