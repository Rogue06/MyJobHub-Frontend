"use client";

import * as React from "react";
import Link from "next/link";
import { Users, Plus, Folder, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/empty-state";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { cn } from "@/lib/utils";

export default function ProfilsPage() {
  const { config, activeWorkspace, setActiveWorkspace, refresh } = useWorkspace();

  return (
    <PageShell
      title="Mes profils"
      description="Chaque profil correspond à une recherche d'emploi distincte (ex. emploi banque, alternance…)"
      actions={
        <Link href="/profils/nouveau" className={cn(buttonVariants(), "gap-2")}>
          <Plus className="h-4 w-4" /> Nouveau profil
        </Link>
      }
    >
      {config.workspaces.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Aucun profil pour le moment"
          description="Crée ton premier profil. Tu pourras importer ton CV PDF et on remplit automatiquement les infos de base."
          action={
            <Link href="/profils/nouveau" className={cn(buttonVariants(), "gap-2")}>
              <Plus className="h-4 w-4" /> Créer un profil
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {config.workspaces.map((w) => (
            <Card key={w.id} className={w.id === activeWorkspace?.id ? "border-primary" : ""}>
              <CardHeader>
                <CardTitle className="text-base">{w.name}</CardTitle>
                <CardDescription className="flex items-center gap-1.5 font-mono text-xs">
                  <Folder className="h-3 w-3" />
                  {w.path}
                </CardDescription>
                <p className="mt-1 text-xs text-muted-foreground">
                  Créé le {new Date(w.createdAt).toLocaleDateString("fr-FR")}
                </p>
              </CardHeader>
              <CardContent className="flex gap-2">
                {w.id !== activeWorkspace?.id ? (
                  <Button size="sm" onClick={() => setActiveWorkspace(w.id)}>
                    Activer
                  </Button>
                ) : (
                  <Button size="sm" disabled variant="secondary">
                    Profil actif
                  </Button>
                )}
                <DeleteProfileDialog workspaceId={w.id} workspaceName={w.name} workspacePath={w.path} onDeleted={refresh} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  );
}

function DeleteProfileDialog({
  workspaceId,
  workspaceName,
  workspacePath,
  onDeleted,
}: {
  workspaceId: string;
  workspaceName: string;
  workspacePath: string;
  onDeleted: () => void | Promise<void>;
}) {
  const [open, setOpen] = React.useState(false);
  const [removeFiles, setRemoveFiles] = React.useState(false);
  const [running, setRunning] = React.useState(false);

  const submit = async () => {
    setRunning(true);
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}${removeFiles ? "?removeFiles=true" : ""}`,
        { method: "DELETE" }
      );
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Suppression impossible");
        return;
      }
      toast.success(removeFiles ? "Profil et fichiers supprimés" : "Profil retiré de Boussole (fichiers conservés)");
      setOpen(false);
      await onDeleted();
    } catch (err) {
      toast.error(`Erreur : ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="ghost" className="text-destructive" />}>
        <Trash2 className="mr-2 h-4 w-4" /> Supprimer
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" /> Supprimer le profil ?
          </DialogTitle>
          <DialogDescription>
            Tu vas retirer <strong>{workspaceName}</strong> de Boussole. Par défaut, ton dossier reste sur le disque.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="font-mono text-xs text-muted-foreground">{workspacePath}</p>
          <label className="flex items-start gap-3 rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm">
            <Checkbox checked={removeFiles} onCheckedChange={(v) => setRemoveFiles(Boolean(v))} />
            <div className="flex-1">
              <p className="font-medium text-destructive">Aussi supprimer les fichiers du disque</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Cela efface définitivement le dossier (CV, candidatures, documents générés). Action irréversible.
              </p>
            </div>
          </label>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={running}>
            Annuler
          </Button>
          <Button variant={removeFiles ? "destructive" : "default"} onClick={submit} disabled={running}>
            {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {removeFiles ? "Supprimer définitivement" : "Retirer de Boussole"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
