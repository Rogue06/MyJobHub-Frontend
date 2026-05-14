import { ACTIONS, ActionDefinition } from "@/lib/actions-catalog";

export type UsageGroupId =
  | "sourcing"
  | "documents"
  | "analyse"
  | "candidatures"
  | "apprendre"
  | "maintenance"
  | "mises-a-jour";

export interface UsageGroup {
  id: UsageGroupId;
  label: string;
  tagline: string;
  iconName: string;
  color: {
    accent: string;
    surface: string;
    text: string;
    border: string;
  };
}

export const USAGE_GROUPS: UsageGroup[] = [
  {
    id: "sourcing",
    label: "Trouver des offres",
    tagline: "Scanne les portails et alimente ton inbox.",
    iconName: "Radar",
    color: {
      accent: "bg-blue-500",
      surface: "bg-blue-500/5",
      text: "text-blue-700 dark:text-blue-300",
      border: "border-blue-500/20",
    },
  },
  {
    id: "documents",
    label: "Rédiger mes documents",
    tagline: "CV adapté, lettre, export LaTeX, version ATS-friendly.",
    iconName: "PenTool",
    color: {
      accent: "bg-emerald-500",
      surface: "bg-emerald-500/5",
      text: "text-emerald-700 dark:text-emerald-300",
      border: "border-emerald-500/20",
    },
  },
  {
    id: "analyse",
    label: "Analyser une opportunité",
    tagline: "Évaluer une offre, comparer plusieurs, fouiller une entreprise.",
    iconName: "Telescope",
    color: {
      accent: "bg-indigo-500",
      surface: "bg-indigo-500/5",
      text: "text-indigo-700 dark:text-indigo-300",
      border: "border-indigo-500/20",
    },
  },
  {
    id: "candidatures",
    label: "Postuler & relancer",
    tagline: "Remplir un formulaire, contacter un recruteur, préparer un entretien.",
    iconName: "Send",
    color: {
      accent: "bg-purple-500",
      surface: "bg-purple-500/5",
      text: "text-purple-700 dark:text-purple-300",
      border: "border-purple-500/20",
    },
  },
  {
    id: "apprendre",
    label: "Apprendre de mon historique",
    tagline: "Identifier ce qui marche, ce qui te fait perdre du temps.",
    iconName: "TrendingUp",
    color: {
      accent: "bg-pink-500",
      surface: "bg-pink-500/5",
      text: "text-pink-700 dark:text-pink-300",
      border: "border-pink-500/20",
    },
  },
  {
    id: "maintenance",
    label: "Entretenir mes données",
    tagline: "Vérifier, dédoublonner, nettoyer ton tracker — sans IA.",
    iconName: "Wrench",
    color: {
      accent: "bg-amber-500",
      surface: "bg-amber-500/5",
      text: "text-amber-700 dark:text-amber-300",
      border: "border-amber-500/20",
    },
  },
  {
    id: "mises-a-jour",
    label: "Mettre à jour l'outil",
    tagline: "Récupérer les améliorations du projet open-source career-ops.",
    iconName: "ArrowUpCircle",
    color: {
      accent: "bg-rose-500",
      surface: "bg-rose-500/5",
      text: "text-rose-700 dark:text-rose-300",
      border: "border-rose-500/20",
    },
  },
];

const ACTION_TO_GROUP: Record<string, UsageGroupId> = {
  // sourcing
  pipeline: "sourcing",
  // documents
  pdf: "documents",
  latex: "documents",
  batch: "documents",
  // analyse
  ofertas: "analyse",
  deep: "analyse",
  training: "analyse",
  project: "analyse",
  // candidatures
  apply: "candidatures",
  contacto: "candidatures",
  followup: "candidatures",
  "interview-prep": "candidatures",
  // apprendre
  patterns: "apprendre",
  // maintenance
  doctor: "maintenance",
  verify: "maintenance",
  normalize: "maintenance",
  dedup: "maintenance",
  merge: "maintenance",
  "sync-check": "maintenance",
  liveness: "maintenance",
  // mises à jour
  "update-check": "mises-a-jour",
  "update-apply": "mises-a-jour",
  rollback: "mises-a-jour",
};

export function groupActionsByUsage(): Record<UsageGroupId, ActionDefinition[]> {
  const result = {} as Record<UsageGroupId, ActionDefinition[]>;
  for (const g of USAGE_GROUPS) result[g.id] = [];
  for (const a of ACTIONS) {
    const g = ACTION_TO_GROUP[a.id];
    if (g) result[g].push(a);
  }
  return result;
}

export function getUsageGroup(id: UsageGroupId): UsageGroup | undefined {
  return USAGE_GROUPS.find((g) => g.id === id);
}
