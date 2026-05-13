"use client";

import * as React from "react";
import { Settings, Loader2, Save, RefreshCw, User, SlidersHorizontal, Globe2, FileText, Download } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { IdentityEditor, IdentityValue } from "@/components/forms/identity-editor";
import { PreferencesEditor } from "@/components/forms/preferences-editor";
import { SourcesEditor } from "@/components/forms/sources-editor";
import { CvEditor } from "@/components/forms/cv-editor";
import { WizardPreferences } from "@/lib/preferences";
import { cn } from "@/lib/utils";

interface WorkspaceFiles {
  profile?: {
    raw?: string;
    parsed?: Record<string, unknown>;
    identity?: IdentityValue;
    preferences?: WizardPreferences;
    error?: string;
  };
  portals?: {
    raw?: string;
    enabledSources?: string[];
    error?: string;
  };
  cv?: string | { error: string };
}

type LogEntry = { type: string; message: string };

export default function ProfilConfigPage() {
  const { activeWorkspace, refresh } = useWorkspace();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [files, setFiles] = React.useState<WorkspaceFiles | null>(null);

  const [identity, setIdentity] = React.useState<IdentityValue>({});
  const [preferences, setPreferences] = React.useState<WizardPreferences | null>(null);
  const [enabledSources, setEnabledSources] = React.useState<string[]>([]);
  const [cv, setCv] = React.useState<string>("");

  const load = React.useCallback(async () => {
    if (!activeWorkspace) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/workspaces/${activeWorkspace.id}/files`, { cache: "no-store" });
      if (!res.ok) throw new Error("Lecture impossible");
      const data = (await res.json()) as WorkspaceFiles;
      setFiles(data);
      if (data.profile?.identity) setIdentity(data.profile.identity);
      if (data.profile?.preferences) setPreferences(data.profile.preferences);
      if (data.portals?.enabledSources) setEnabledSources(data.portals.enabledSources);
      if (typeof data.cv === "string") setCv(data.cv);
    } catch (err) {
      toast.error(`Impossible de lire les fichiers du profil : ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }, [activeWorkspace]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!activeWorkspace) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/workspaces/${activeWorkspace.id}/files`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identity,
          preferences,
          enabledSources,
          cv,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Sauvegarde impossible");
        return;
      }
      toast.success(`Enregistré : ${(json.written as string[]).join(", ")}`);
      await refresh();
    } catch (err) {
      toast.error(`Erreur : ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSaving(false);
    }
  };

  if (!activeWorkspace) {
    return (
      <PageShell title="Configuration">
        <EmptyState
          icon={Settings}
          title="Aucun profil actif"
          description="Sélectionne un profil dans le sélecteur en haut à droite pour pouvoir le configurer."
        />
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Configuration"
      description={`Profil actif : ${activeWorkspace.name}`}
      actions={
        <>
          <UpdateCareerOpsButton workspaceId={activeWorkspace.id} />
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading || saving}>
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} /> Recharger
          </Button>
          <Button size="sm" onClick={save} disabled={loading || saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Enregistrer
          </Button>
        </>
      }
    >
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : files?.profile?.error || files?.portals?.error ? (
        <Alert variant="destructive">
          <AlertTitle>Profil non initialisé</AlertTitle>
          <AlertDescription>
            Les fichiers de configuration de ce profil ne sont pas accessibles. Tu peux essayer de le recréer via le wizard, ou vérifier que career-ops a bien été installé.
          </AlertDescription>
        </Alert>
      ) : (
        <Tabs defaultValue="identity">
          <TabsList>
            <TabsTrigger value="identity">
              <User className="mr-2 h-4 w-4" /> Identité
            </TabsTrigger>
            <TabsTrigger value="preferences">
              <SlidersHorizontal className="mr-2 h-4 w-4" /> Préférences
            </TabsTrigger>
            <TabsTrigger value="sources">
              <Globe2 className="mr-2 h-4 w-4" /> Sources
            </TabsTrigger>
            <TabsTrigger value="cv">
              <FileText className="mr-2 h-4 w-4" /> CV
            </TabsTrigger>
          </TabsList>
          <TabsContent value="identity" className="mt-6">
            <IdentityEditor value={identity} onChange={setIdentity} />
          </TabsContent>
          <TabsContent value="preferences" className="mt-6">
            {preferences ? (
              <PreferencesEditor value={preferences} onChange={setPreferences} />
            ) : (
              <p className="text-sm text-muted-foreground">Aucune préférence chargée.</p>
            )}
          </TabsContent>
          <TabsContent value="sources" className="mt-6">
            <SourcesEditor value={enabledSources} onChange={setEnabledSources} />
          </TabsContent>
          <TabsContent value="cv" className="mt-6">
            <CvEditor value={cv} onChange={setCv} />
          </TabsContent>
        </Tabs>
      )}
    </PageShell>
  );
}

function UpdateCareerOpsButton({ workspaceId }: { workspaceId: string }) {
  const [open, setOpen] = React.useState(false);
  const [running, setRunning] = React.useState(false);
  const [logs, setLogs] = React.useState<LogEntry[]>([]);

  const append = (e: LogEntry) => setLogs((p) => [...p, e]);

  const run = async () => {
    setRunning(true);
    setLogs([]);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/update`, { method: "POST" });
      if (!res.ok || !res.body) {
        append({ type: "error", message: "Le serveur n'a pas pu démarrer la mise à jour." });
        return;
      }
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
            const evt = JSON.parse(line.slice(5).trim());
            append(evt as LogEntry);
          } catch {}
        }
      }
    } catch (err) {
      append({ type: "error", message: err instanceof Error ? err.message : String(err) });
    } finally {
      setRunning(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="outline" size="sm" />}>
        <Download className="mr-2 h-4 w-4" /> Mettre à jour career-ops
      </SheetTrigger>
      <SheetContent side="right" className="w-[480px] sm:max-w-none">
        <SheetHeader>
          <SheetTitle>Mise à jour de career-ops</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            On lance <code>git pull</code> sur le dépôt career-ops du profil actif, puis <code>npm install</code> et <code>npm run doctor</code>. Tes fichiers locaux (CV, profil, portails) ne seront pas modifiés.
          </p>
          <Button onClick={run} disabled={running}>
            {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            {running ? "Mise à jour en cours…" : "Lancer la mise à jour"}
          </Button>
          <Separator />
          <ScrollArea className="h-[420px] rounded-md border bg-black/90 text-green-100">
            <div className="space-y-1 p-3 font-mono text-xs">
              {logs.length === 0 ? (
                <p className="text-muted-foreground/80">Les logs s'afficheront ici…</p>
              ) : (
                logs.map((l, i) => (
                  <div
                    key={i}
                    className={cn(
                      l.type === "error"
                        ? "text-red-300"
                        : l.type === "warn"
                        ? "text-amber-300"
                        : l.type === "success" || l.type === "done"
                        ? "text-emerald-300"
                        : l.type === "step"
                        ? "text-blue-300 font-semibold"
                        : "text-zinc-300"
                    )}
                  >
                    {l.message}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
