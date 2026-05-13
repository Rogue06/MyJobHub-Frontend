import { WizardPreferences, DEFAULT_PREFERENCES } from "@/lib/preferences";
import { DEFAULT_SOURCES } from "@/lib/sources";

export type WizardStepId = "name" | "pdf" | "review" | "preferences" | "sources" | "provision";

export interface WizardDraft {
  step: WizardStepId;
  name: string;
  parentDir: string;
  pdfFileName: string | null;
  pdfText: string;
  cvMarkdown: string;
  profileYaml: string;
  preferences: WizardPreferences;
  enabledSources: string[];
  createdWorkspaceId: string | null;
}

export const WIZARD_STEPS: { id: WizardStepId; label: string; description: string }[] = [
  { id: "name", label: "Nom & dossier", description: "Comment veux-tu appeler ce profil ?" },
  { id: "pdf", label: "Import du CV", description: "Glisse ton CV PDF, on extrait les infos" },
  { id: "review", label: "Vérification", description: "Relis ce que l'IA a généré" },
  { id: "preferences", label: "Préférences", description: "Contrat, domaines, rémunération, mobilité" },
  { id: "sources", label: "Sources d'annonces", description: "Sites à scanner" },
  { id: "provision", label: "Installation", description: "On prépare ton profil" },
];

export function getInitialDraft(defaultParentDir: string): WizardDraft {
  return {
    step: "name",
    name: "",
    parentDir: defaultParentDir,
    pdfFileName: null,
    pdfText: "",
    cvMarkdown: "",
    profileYaml: "",
    preferences: { ...DEFAULT_PREFERENCES },
    enabledSources: DEFAULT_SOURCES.filter((s) => s.enabledByDefault).map((s) => s.id),
    createdWorkspaceId: null,
  };
}

export const DRAFT_STORAGE_KEY = "boussole-wizard-draft-v1";

export function loadDraft(defaultParentDir: string): WizardDraft {
  if (typeof window === "undefined") return getInitialDraft(defaultParentDir);
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return getInitialDraft(defaultParentDir);
    const parsed = JSON.parse(raw) as Partial<WizardDraft>;
    return { ...getInitialDraft(defaultParentDir), ...parsed };
  } catch {
    return getInitialDraft(defaultParentDir);
  }
}

export function saveDraft(draft: WizardDraft): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // ignore quota errors
  }
}

export function clearDraft(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {}
}
