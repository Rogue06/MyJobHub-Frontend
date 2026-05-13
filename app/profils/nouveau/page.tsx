"use client";

import * as React from "react";
import { PageShell } from "@/components/layout/page-shell";
import { WizardLayout } from "./_components/wizard-layout";
import { Step1Name } from "./_components/step-1-name";
import { Step2Pdf } from "./_components/step-2-pdf";
import { Step3Review } from "./_components/step-3-review";
import { Step4Preferences } from "./_components/step-4-preferences";
import { Step5Sources } from "./_components/step-5-sources";
import { Step6Provision } from "./_components/step-6-provision";
import {
  WizardDraft,
  WizardStepId,
  WIZARD_STEPS,
  getInitialDraft,
  loadDraft,
  saveDraft,
} from "./_lib/wizard-types";
export default function NouveauProfilPage() {
  const [defaultParent] = React.useState(() => {
    if (typeof window !== "undefined") {
      const guess = "/Users/" + ((window.navigator.userAgent.match(/Mac/) ? "" : "") + "");
      return guess.length > 7 ? guess : "~/Documents/Boussole";
    }
    return "~/Documents/Boussole";
  });

  const [draft, setDraft] = React.useState<WizardDraft>(() => getInitialDraft(defaultParent));
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setDraft(loadDraft(defaultParent));
    setHydrated(true);
  }, [defaultParent]);

  React.useEffect(() => {
    if (hydrated) saveDraft(draft);
  }, [draft, hydrated]);

  const stepIndex = WIZARD_STEPS.findIndex((s) => s.id === draft.step);
  const goTo = (id: WizardStepId) => setDraft((d) => ({ ...d, step: id }));
  const next = () => {
    const idx = WIZARD_STEPS.findIndex((s) => s.id === draft.step);
    if (idx >= 0 && idx < WIZARD_STEPS.length - 1) {
      goTo(WIZARD_STEPS[idx + 1].id);
    }
  };
  const back = () => {
    const idx = WIZARD_STEPS.findIndex((s) => s.id === draft.step);
    if (idx > 0) goTo(WIZARD_STEPS[idx - 1].id);
  };

  return (
    <PageShell
      title="Créer un nouveau profil"
      description={`Étape ${stepIndex + 1}/${WIZARD_STEPS.length} : ${WIZARD_STEPS[stepIndex]?.label ?? ""}`}
    >
      <WizardLayout currentStep={draft.step}>
        {draft.step === "name" ? (
          <Step1Name draft={draft} setDraft={setDraft} onNext={next} />
        ) : null}
        {draft.step === "pdf" ? (
          <Step2Pdf draft={draft} setDraft={setDraft} onNext={next} onBack={back} />
        ) : null}
        {draft.step === "review" ? (
          <Step3Review draft={draft} setDraft={setDraft} onNext={next} onBack={back} />
        ) : null}
        {draft.step === "preferences" ? (
          <Step4Preferences draft={draft} setDraft={setDraft} onNext={next} onBack={back} />
        ) : null}
        {draft.step === "sources" ? (
          <Step5Sources draft={draft} setDraft={setDraft} onNext={next} onBack={back} />
        ) : null}
        {draft.step === "provision" ? (
          <Step6Provision draft={draft} setDraft={setDraft} onBack={back} />
        ) : null}
      </WizardLayout>
    </PageShell>
  );
}
