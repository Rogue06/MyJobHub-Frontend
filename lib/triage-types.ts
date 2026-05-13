export type RejectionReason =
  | "mauvais-metier"
  | "salaire-trop-bas"
  | "trop-loin"
  | "mauvais-contrat"
  | "entreprise-non-souhaitee"
  | "autre";

export const REJECTION_REASONS: { id: RejectionReason; label: string; description: string }[] = [
  { id: "mauvais-metier", label: "Mauvais métier", description: "Le poste ne correspond pas à ce que je cherche" },
  { id: "salaire-trop-bas", label: "Salaire insuffisant", description: "Rémunération trop faible" },
  { id: "trop-loin", label: "Trop loin / mauvais lieu", description: "Géographie incompatible" },
  { id: "mauvais-contrat", label: "Type de contrat", description: "CDD au lieu de CDI, etc." },
  { id: "entreprise-non-souhaitee", label: "Entreprise non souhaitée", description: "Je ne veux pas postuler ici" },
  { id: "autre", label: "Autre raison", description: "Précise dans la note" },
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
  reason: RejectionReason;
  note?: string;
}

export interface BoussoleFeedback {
  rejections: FeedbackEntry[];
  approvals: { id: string; createdAt: string; url: string; title?: string }[];
}
