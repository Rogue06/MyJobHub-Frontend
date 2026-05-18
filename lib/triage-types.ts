export type RejectionReason =
  | "annonce-expiree"
  | "mauvais-metier"
  | "salaire-trop-bas"
  | "trop-loin"
  | "mauvais-contrat"
  | "entreprise-non-souhaitee"
  | "ton-agressif"
  | "trop-de-pression"
  | "secteur-non-souhaite"
  | "autre";

/** Raisons « factuelles » qui ne reflètent pas une préférence du candidat
 *  (annonce morte, doublon, etc.). Le module d'apprentissage doit les
 *  ignorer pour ne pas en tirer de règles de filtrage. */
export const FACTUAL_REJECTION_REASONS: RejectionReason[] = ["annonce-expiree"];

export const REJECTION_REASONS: { id: RejectionReason; label: string; description: string }[] = [
  { id: "annonce-expiree", label: "Annonce expirée / plus dispo", description: "Lien mort, offre retirée, page 404…" },
  { id: "mauvais-metier", label: "Mauvais métier", description: "Le poste ne correspond pas à ce que je cherche" },
  { id: "salaire-trop-bas", label: "Salaire insuffisant", description: "Rémunération trop faible pour la zone/poste" },
  { id: "trop-loin", label: "Trop loin / mauvais lieu", description: "Géographie incompatible (été ou général)" },
  { id: "mauvais-contrat", label: "Type de contrat", description: "CDD trop court, intérim, freelance, etc." },
  { id: "entreprise-non-souhaitee", label: "Entreprise non souhaitée", description: "Je ne veux pas postuler ici" },
  { id: "ton-agressif", label: "Ton agressif / chasseur", description: "Langage commercial pur (« chasseur », « tueur »…)" },
  { id: "trop-de-pression", label: "Trop de pression / objectifs", description: "Commission pure, objectifs durs, ambiance stressante" },
  { id: "secteur-non-souhaite", label: "Secteur non souhaité", description: "Domaine ou marché qui ne me plaît pas" },
  { id: "autre", label: "Autre raison", description: "Précise dans la note" },
];

export type LikedAspect =
  | "secteur-domaine"
  | "salaire"
  | "package-materiel"
  | "formation"
  | "localisation"
  | "contrat"
  | "teletravail"
  | "evolution-carriere"
  | "ambiance-equipe"
  | "produit-mission"
  | "horaires"
  | "autre";

export const LIKED_ASPECTS: { id: LikedAspect; label: string; description: string }[] = [
  { id: "secteur-domaine", label: "Secteur / domaine", description: "Le métier ou le marché m'intéresse" },
  { id: "salaire", label: "Salaire", description: "Rémunération attractive" },
  { id: "package-materiel", label: "Package matériel", description: "Voiture, ordi, iPhone, téléphone…" },
  { id: "formation", label: "Formation à l'arrivée", description: "Parcours d'intégration, montée en compétences" },
  { id: "localisation", label: "Localisation", description: "Proche de chez moi ou ville sympa" },
  { id: "contrat", label: "Type de contrat", description: "CDI direct, CDD long, intéressant" },
  { id: "teletravail", label: "Télétravail", description: "Hybride ou full remote" },
  { id: "evolution-carriere", label: "Évolution / carrière", description: "Perspectives, mobilité interne" },
  { id: "ambiance-equipe", label: "Ambiance / équipe", description: "Description chaleureuse, valeurs sympa" },
  { id: "produit-mission", label: "Produit / mission", description: "Ce qu'ils font me parle (digital, banque…)" },
  { id: "horaires", label: "Horaires / RTT", description: "Bon équilibre vie pro / perso" },
  { id: "autre", label: "Autre point positif", description: "Précise dans la note" },
];

export interface PipelineEntry {
  status: "pending" | "processed" | "error";
  url: string;
  raw: string;
  company?: string;
  role?: string;
  score?: string;
  note?: string;
}

export interface FeedbackEntry {
  id: string;
  createdAt: string;
  url: string;
  title?: string;
  company?: string;
  /** @deprecated kept for backward compatibility — use `reasons` */
  reason?: RejectionReason;
  /** Plusieurs raisons sont possibles (multi-select). */
  reasons?: RejectionReason[];
  /** Aspects qui plaisaient malgré le rejet, pour aider le filtre apprenant
   *  à proposer des offres « comme ça mais sans X ». */
  liked?: LikedAspect[];
  note?: string;
}

export interface MyJobHubFeedback {
  rejections: FeedbackEntry[];
  approvals: { id: string; createdAt: string; url: string; title?: string }[];
}

/** Retourne la liste des raisons d'un FeedbackEntry, en gérant les anciens
 *  enregistrements qui n'avaient qu'un champ `reason`. */
export function getEntryReasons(entry: FeedbackEntry): RejectionReason[] {
  if (entry.reasons && entry.reasons.length > 0) return entry.reasons;
  if (entry.reason) return [entry.reason];
  return [];
}
