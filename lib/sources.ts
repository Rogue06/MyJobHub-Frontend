export type SourceCategory = "generaliste" | "banque-finance" | "alternance" | "carrieres-directes";

export interface JobSource {
  id: string;
  name: string;
  url: string;
  category: SourceCategory;
  enabledByDefault: boolean;
  description?: string;
}

export const SOURCE_CATEGORIES: Record<SourceCategory, { label: string; description: string }> = {
  generaliste: {
    label: "Généralistes",
    description: "Grands sites d'annonces tous secteurs",
  },
  "banque-finance": {
    label: "Banque & Finance",
    description: "Sites spécialisés dans les métiers de la finance",
  },
  alternance: {
    label: "Alternance & Stages",
    description: "Plateformes dédiées à l'alternance et aux stages",
  },
  "carrieres-directes": {
    label: "Sites carrières directs",
    description: "Pages emploi officielles des grandes banques",
  },
};

export const DEFAULT_SOURCES: JobSource[] = [
  // Généralistes
  { id: "france-travail", name: "France Travail", url: "https://candidat.francetravail.fr/offres/recherche", category: "generaliste", enabledByDefault: true },
  { id: "apec", name: "APEC", url: "https://www.apec.fr", category: "generaliste", enabledByDefault: true, description: "Spécialisé cadres" },
  { id: "indeed-fr", name: "Indeed France", url: "https://fr.indeed.com", category: "generaliste", enabledByDefault: true },
  { id: "linkedin", name: "LinkedIn Jobs", url: "https://www.linkedin.com/jobs", category: "generaliste", enabledByDefault: true },
  { id: "hellowork", name: "HelloWork", url: "https://www.hellowork.com", category: "generaliste", enabledByDefault: true },
  { id: "wttj", name: "Welcome to the Jungle", url: "https://www.welcometothejungle.com", category: "generaliste", enabledByDefault: true },
  { id: "monster-fr", name: "Monster France", url: "https://www.monster.fr", category: "generaliste", enabledByDefault: false },
  { id: "regionsjob", name: "RegionsJob", url: "https://www.regionsjob.com", category: "generaliste", enabledByDefault: false },
  { id: "cadremploi", name: "Cadremploi", url: "https://www.cadremploi.fr", category: "generaliste", enabledByDefault: true },
  { id: "glassdoor-fr", name: "Glassdoor France", url: "https://www.glassdoor.fr", category: "generaliste", enabledByDefault: false },

  // Banque-finance
  { id: "efinancialcareers", name: "eFinancialCareers", url: "https://www.efinancialcareers.fr", category: "banque-finance", enabledByDefault: true },
  { id: "jobbourse", name: "JobBourse", url: "https://www.jobbourse.com", category: "banque-finance", enabledByDefault: false },
  { id: "robert-walters", name: "Robert Walters", url: "https://www.robertwalters.fr", category: "banque-finance", enabledByDefault: false, description: "Cabinet de recrutement spécialisé" },
  { id: "michael-page", name: "Michael Page Finance", url: "https://www.michaelpage.fr", category: "banque-finance", enabledByDefault: false, description: "Cabinet de recrutement" },
  { id: "hays-fr", name: "Hays Banque", url: "https://www.hays.fr", category: "banque-finance", enabledByDefault: false, description: "Cabinet de recrutement" },

  // Alternance
  { id: "alternance-fr", name: "Alternance.fr", url: "https://www.alternance.fr", category: "alternance", enabledByDefault: true },
  { id: "jobteaser", name: "JobTeaser", url: "https://www.jobteaser.com/fr", category: "alternance", enabledByDefault: true, description: "Étudiants & jeunes diplômés" },
  { id: "walt-community", name: "Walt Community", url: "https://walt.community", category: "alternance", enabledByDefault: true, description: "Plateforme alternance" },
  { id: "studyrama-emploi", name: "Studyrama Emploi", url: "https://emploi.studyrama.com", category: "alternance", enabledByDefault: false },
  { id: "ft-alternance", name: "France Travail Alternance", url: "https://candidat.francetravail.fr/offres/recherche?typeContrat=E2", category: "alternance", enabledByDefault: true },

  // Carrières directes banques
  { id: "bnp-paribas", name: "BNP Paribas Carrières", url: "https://group.bnpparibas/emploi-carriere", category: "carrieres-directes", enabledByDefault: true },
  { id: "societe-generale", name: "Société Générale Carrières", url: "https://careers.societegenerale.com/fr", category: "carrieres-directes", enabledByDefault: true },
  { id: "credit-agricole", name: "Crédit Agricole Carrières", url: "https://www.recrutement.credit-agricole.com", category: "carrieres-directes", enabledByDefault: true },
  { id: "lcl", name: "LCL Carrières", url: "https://lcl-recrute.fr", category: "carrieres-directes", enabledByDefault: true },
  { id: "cic", name: "CIC Carrières", url: "https://recrutement.cic.fr", category: "carrieres-directes", enabledByDefault: true },
  { id: "bpce", name: "Groupe BPCE", url: "https://groupebpce.com/carrieres", category: "carrieres-directes", enabledByDefault: true },
  { id: "banque-populaire", name: "Banque Populaire", url: "https://www.banquepopulaire.fr/recrutement", category: "carrieres-directes", enabledByDefault: true },
  { id: "caisse-epargne", name: "Caisse d'Épargne", url: "https://www.caisse-epargne.fr/recrutement", category: "carrieres-directes", enabledByDefault: true },
  { id: "hsbc-fr", name: "HSBC France", url: "https://www.hsbc.com/careers", category: "carrieres-directes", enabledByDefault: false },
  { id: "ing-fr", name: "ING France", url: "https://www.ing.jobs", category: "carrieres-directes", enabledByDefault: false },
  { id: "boursorama", name: "Boursorama Banque", url: "https://www.boursorama.com/societe/recrutement", category: "carrieres-directes", enabledByDefault: false },
  { id: "milleis", name: "Milleis Banque", url: "https://www.milleis.fr", category: "carrieres-directes", enabledByDefault: false, description: "Banque privée" },
  { id: "neuflize-obc", name: "Neuflize OBC", url: "https://www.neuflizeobc.fr", category: "carrieres-directes", enabledByDefault: false, description: "Banque privée" },
];

export function getSourcesByCategory(): Record<SourceCategory, JobSource[]> {
  const grouped: Record<SourceCategory, JobSource[]> = {
    generaliste: [],
    "banque-finance": [],
    alternance: [],
    "carrieres-directes": [],
  };
  for (const s of DEFAULT_SOURCES) {
    grouped[s.category].push(s);
  }
  return grouped;
}
