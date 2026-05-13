"use client";

import * as React from "react";
import { ArrowLeft, Upload, FileText, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { WizardStepCard } from "./wizard-layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { WizardDraft } from "../_lib/wizard-types";
import { cn } from "@/lib/utils";

interface Props {
  draft: WizardDraft;
  setDraft: React.Dispatch<React.SetStateAction<WizardDraft>>;
  onNext: () => void;
  onBack: () => void;
}

export function Step2Pdf({ draft, setDraft, onNext, onBack }: Props) {
  const [uploading, setUploading] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);
  const [dragOver, setDragOver] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Le fichier doit être au format PDF.");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/wizard/extract-pdf", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Extraction impossible.");
        return;
      }
      setDraft((d) => ({ ...d, pdfFileName: json.fileName ?? file.name, pdfText: json.text ?? "" }));
      toast.success(`PDF lu (${json.pageCount ?? "?"} page(s), ${json.characterCount ?? "?"} caractères)`);
    } catch (err) {
      toast.error(`Erreur lors de la lecture du PDF : ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setUploading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/wizard/generate-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfText: draft.pdfText }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "La génération a échoué.");
        return;
      }
      setDraft((d) => ({ ...d, cvMarkdown: json.cvMarkdown, profileYaml: json.profileYaml }));
      toast.success("CV et profil générés. Tu vas pouvoir les relire à l'étape suivante.");
      onNext();
    } catch (err) {
      toast.error(`Erreur : ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <WizardStepCard
      title="Importe ton CV"
      description="Glisse ton CV PDF (par exemple un export depuis Canva). On extrait le texte puis l'IA structure tout. Pas de PDF ? Tu peux coller le texte directement."
      footer={
        <>
          <Button variant="ghost" onClick={onBack} disabled={generating || uploading}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Retour
          </Button>
          <Button onClick={handleGenerate} disabled={draft.pdfText.trim().length < 30 || generating || uploading}>
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Génération…
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" /> Générer le profil avec l'IA
              </>
            )}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleFile(file);
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 p-10 text-center transition-colors hover:bg-muted/40",
            dragOver && "border-primary bg-primary/5"
          )}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          {uploading ? (
            <>
              <Loader2 className="mb-2 h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm font-medium">Lecture du PDF en cours…</p>
            </>
          ) : draft.pdfFileName ? (
            <>
              <FileText className="mb-2 h-8 w-8 text-primary" />
              <p className="text-sm font-medium">{draft.pdfFileName}</p>
              <p className="mt-1 text-xs text-muted-foreground">Clique pour remplacer</p>
            </>
          ) : (
            <>
              <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">Glisse ton CV ici, ou clique pour parcourir</p>
              <p className="mt-1 text-xs text-muted-foreground">PDF uniquement, 15 Mo max</p>
            </>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Texte extrait (modifiable)</p>
          <Textarea
            value={draft.pdfText}
            onChange={(e) => setDraft((d) => ({ ...d, pdfText: e.target.value }))}
            rows={10}
            placeholder="Le texte de ton CV apparaîtra ici. Tu peux aussi le coller directement."
            className="font-mono text-xs"
          />
          <p className="text-xs text-muted-foreground">
            Relis pour t'assurer que tout est bien lisible. L'IA s'en servira pour structurer ton profil à l'étape suivante.
          </p>
        </div>
      </div>
    </WizardStepCard>
  );
}
