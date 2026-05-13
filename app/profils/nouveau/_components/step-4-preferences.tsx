"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { WizardStepCard } from "./wizard-layout";
import { Button } from "@/components/ui/button";
import { PreferencesEditor } from "@/components/forms/preferences-editor";
import { WizardDraft } from "../_lib/wizard-types";

interface Props {
  draft: WizardDraft;
  setDraft: React.Dispatch<React.SetStateAction<WizardDraft>>;
  onNext: () => void;
  onBack: () => void;
}

export function Step4Preferences({ draft, setDraft, onNext, onBack }: Props) {
  const canContinue =
    draft.preferences.contractTypes.length > 0 &&
    (draft.preferences.domains.length > 0 || draft.preferences.customDomains.length > 0);

  return (
    <WizardStepCard
      title="Tes préférences"
      description="Affine ta recherche. Tu peux tout modifier plus tard."
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
      <PreferencesEditor
        value={draft.preferences}
        onChange={(next) => setDraft((d) => ({ ...d, preferences: next }))}
      />
    </WizardStepCard>
  );
}
