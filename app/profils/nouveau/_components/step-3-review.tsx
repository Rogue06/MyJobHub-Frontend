"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight, FileText, Wand2 } from "lucide-react";
import { WizardStepCard } from "./wizard-layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { WizardDraft } from "../_lib/wizard-types";

interface Props {
  draft: WizardDraft;
  setDraft: React.Dispatch<React.SetStateAction<WizardDraft>>;
  onNext: () => void;
  onBack: () => void;
}

export function Step3Review({ draft, setDraft, onNext, onBack }: Props) {
  const canContinue = draft.cvMarkdown.trim().length > 0 && draft.profileYaml.trim().length > 0;

  return (
    <WizardStepCard
      title="Vérifie ce que l'IA a généré"
      description="Relis et corrige si besoin. Tu pourras aussi tout modifier plus tard dans la section Configuration."
      footer={
        <>
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Retour
          </Button>
          <Button onClick={onNext} disabled={!canContinue}>
            Continuer <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </>
      }
    >
      {!canContinue ? (
        <Alert className="mb-4">
          <Wand2 className="h-4 w-4" />
          <AlertTitle>Aucun contenu généré</AlertTitle>
          <AlertDescription>
            Reviens à l'étape précédente pour lancer la génération. Tu peux aussi remplir manuellement les zones ci-dessous.
          </AlertDescription>
        </Alert>
      ) : null}

      <Tabs defaultValue="cv">
        <TabsList>
          <TabsTrigger value="cv">
            <FileText className="mr-2 h-4 w-4" /> CV (cv.md)
          </TabsTrigger>
          <TabsTrigger value="profile">
            <Wand2 className="mr-2 h-4 w-4" /> Profil (profile.yml)
          </TabsTrigger>
        </TabsList>
        <TabsContent value="cv">
          <p className="mb-2 text-xs text-muted-foreground">
            Format Markdown. Ce fichier sera la source de vérité utilisée pour générer tes CV adaptés à chaque offre.
          </p>
          <Textarea
            value={draft.cvMarkdown}
            onChange={(e) => setDraft((d) => ({ ...d, cvMarkdown: e.target.value }))}
            rows={20}
            className="font-mono text-xs"
            placeholder="# Identité&#10;..."
          />
        </TabsContent>
        <TabsContent value="profile">
          <p className="mb-2 text-xs text-muted-foreground">
            Format YAML. Contient ton identité, tes archetypes, ta narration, etc. Tu compléteras la partie préférences à l'étape suivante.
          </p>
          <Textarea
            value={draft.profileYaml}
            onChange={(e) => setDraft((d) => ({ ...d, profileYaml: e.target.value }))}
            rows={20}
            className="font-mono text-xs"
            placeholder="candidate:&#10;  full_name: ..."
          />
        </TabsContent>
      </Tabs>
    </WizardStepCard>
  );
}
