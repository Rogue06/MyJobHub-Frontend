"use client";

import * as React from "react";
import { ArrowRight } from "lucide-react";
import { WizardStepCard } from "./wizard-layout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { WizardDraft } from "../_lib/wizard-types";

interface Props {
  draft: WizardDraft;
  setDraft: React.Dispatch<React.SetStateAction<WizardDraft>>;
  onNext: () => void;
}

export function Step1Name({ draft, setDraft, onNext }: Props) {
  const canContinue = draft.name.trim().length >= 2 && draft.parentDir.trim().length > 0;

  return (
    <WizardStepCard
      title="Donne un nom à ce profil"
      description="Chaque profil correspond à une recherche d'emploi indépendante. Tu peux en avoir plusieurs (ex. emploi, alternance)."
      footer={
        <>
          <p className="text-xs text-muted-foreground">Tes choix sont sauvegardés automatiquement</p>
          <Button onClick={onNext} disabled={!canContinue}>
            Continuer <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="profile-name">Nom du profil</Label>
          <Input
            id="profile-name"
            placeholder="Ex. Emploi banque, Alternance ES Bank…"
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          />
          <p className="text-xs text-muted-foreground">
            Ce nom n'est utilisé que dans l'interface, tu peux le changer plus tard.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="parent-dir">Dossier parent</Label>
          <Input
            id="parent-dir"
            placeholder="/Users/.../Documents/Boussole"
            value={draft.parentDir}
            onChange={(e) => setDraft((d) => ({ ...d, parentDir: e.target.value }))}
            className="font-mono text-xs"
          />
          <p className="text-xs text-muted-foreground">
            Le dossier du profil sera créé à l'intérieur. Tu peux utiliser <code>~/</code> pour ton dossier personnel.
          </p>
        </div>
      </div>
    </WizardStepCard>
  );
}
