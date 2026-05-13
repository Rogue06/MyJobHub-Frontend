"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { WizardStepCard } from "./wizard-layout";
import { Button } from "@/components/ui/button";
import { SourcesEditor } from "@/components/forms/sources-editor";
import { WizardDraft } from "../_lib/wizard-types";

interface Props {
  draft: WizardDraft;
  setDraft: React.Dispatch<React.SetStateAction<WizardDraft>>;
  onNext: () => void;
  onBack: () => void;
}

export function Step5Sources({ draft, setDraft, onNext, onBack }: Props) {
  return (
    <WizardStepCard
      title="Sources d'annonces à scanner"
      description="Coche les sites où tu veux que l'outil cherche tes futures offres. Tu peux tout désactiver et ne garder que les sites carrières directs des banques, par exemple."
      footer={
        <>
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Retour
          </Button>
          <Button onClick={onNext} disabled={draft.enabledSources.length === 0}>
            Continuer <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </>
      }
    >
      <SourcesEditor
        value={draft.enabledSources}
        onChange={(next) => setDraft((d) => ({ ...d, enabledSources: next }))}
      />
    </WizardStepCard>
  );
}
