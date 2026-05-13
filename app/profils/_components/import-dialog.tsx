"use client";

import * as React from "react";
import {
  Download,
  FolderInput,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
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
import { Badge } from "@/components/ui/badge";
import { useWorkspace } from "@/components/providers/workspace-provider";
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

export function ImportProfileDialog() {
  const { refresh } = useWorkspace();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [pathInput, setPathInput] = React.useState("");
  const [checking, setChecking] = React.useState(false);
  const [importing, setImporting] = React.useState(false);
  const [result, setResult] = React.useState<CheckResult | null>(null);

  const reset = () => {
    setName("");
    setPathInput("");
    setResult(null);
  };

  const check = async () => {
    if (!pathInput.trim()) return;
    setChecking(true);
    setResult(null);
    try {
      const res = await fetch(`/api/workspaces/import?path=${encodeURIComponent(pathInput.trim())}`);
      const json = (await res.json()) as CheckResult;
      setResult(json);
      if (json.ok && !name.trim() && json.resolvedWorkspacePath) {
        const folderName = (json.careerOpsRelPath === "."
          ? json.resolvedWorkspacePath
          : pathInput
        )
          .split("/")
          .filter(Boolean)
          .slice(-1)[0];
        setName(formatName(folderName));
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Importer un profil career-ops existant</DialogTitle>
          <DialogDescription>
            Indique le chemin d'un dossier déjà configuré (avec ton CV, ton profile.yml et tes portails).
            MyJobHub détecte automatiquement la structure.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
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
                    void check();
                  }
                }}
                className="font-mono text-xs"
              />
              <Button onClick={check} disabled={!pathInput.trim() || checking} variant="outline">
                {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Tu peux utiliser <code>~/</code> pour ton dossier personnel.
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
        </div>

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
  return folderName
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
