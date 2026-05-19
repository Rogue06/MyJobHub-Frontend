export interface ContractTypeOption {
  id: string;
  label: string;
  description?: string;
}

export const CONTRACT_TYPES: ContractTypeOption[] = [
  { id: "cdi", label: "CDI", description: "Contrat à durée indéterminée" },
  { id: "cdd", label: "CDD", description: "Contrat à durée déterminée" },
  { id: "alternance", label: "Alternance", description: "Apprentissage ou professionnalisation" },
  { id: "stage", label: "Stage", description: "Stage de fin d'études ou conventionné" },
  { id: "freelance", label: "Freelance / Indépendant", description: "Mission en portage ou en direct" },
  { id: "interim", label: "Intérim", description: "Mission temporaire" },
];

export interface DomainOption {
  id: string;
  label: string;
}

export const DEFAULT_DOMAINS: DomainOption[] = [
  { id: "banque-detail", label: "Banque de détail" },
  { id: "banque-privee", label: "Banque privée" },
  { id: "gestion-patrimoine", label: "Gestion de patrimoine" },
  { id: "banque-investissement", label: "Banque d'investissement" },
  { id: "conseil-bancaire", label: "Conseil bancaire" },
  { id: "credit", label: "Crédit / Financement" },
  { id: "assurance", label: "Assurance" },
  { id: "audit-controle", label: "Audit / Contrôle interne" },
  { id: "conformite-risque", label: "Conformité / Risques" },
  { id: "marketing-bancaire", label: "Marketing bancaire" },
  { id: "operations", label: "Opérations bancaires" },
  { id: "back-middle-office", label: "Back-office / Middle-office" },
  { id: "tresorerie", label: "Trésorerie" },
  { id: "marches-financiers", label: "Marchés financiers" },
  { id: "data-finance", label: "Data / Analyse financière" },
  { id: "relation-client", label: "Relation client / Accueil" },
];

export interface SeniorityOption {
  id: "junior" | "confirme" | "senior";
  label: string;
  description: string;
}

export const SENIORITY_LEVELS: SeniorityOption[] = [
  { id: "junior", label: "Junior", description: "Débutant ou jeune diplômé" },
  { id: "confirme", label: "Confirmé", description: "Plusieurs années d'expérience" },
  { id: "senior", label: "Senior", description: "Expert ou poste à responsabilités" },
];

export type SeniorityId = "junior" | "confirme" | "senior";

export interface WizardPreferences {
  contractTypes: string[];
  domains: string[];
  customDomains: string[];
  /** Multi-sélection : permet ex. [junior, confirme] pour viser à la fois
   *  les offres « débutant » ET « confirmé » (utile pour Mickaël qui sort
   *  d'un break carrière). */
  seniority: SeniorityId[];
  salaryMin: number;
  salaryTarget: number;
  baseCity: string;
  mobilityKm: number;
  remoteOk: boolean;
  preferredLocations: string[];
  excludedLocations: string[];
}

export const DEFAULT_PREFERENCES: WizardPreferences = {
  contractTypes: ["cdi"],
  domains: [],
  customDomains: [],
  seniority: ["confirme"],
  salaryMin: 25000,
  salaryTarget: 35000,
  baseCity: "",
  mobilityKm: 30,
  remoteOk: true,
  preferredLocations: [],
  excludedLocations: [],
};
