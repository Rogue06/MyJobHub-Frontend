export type ActionKind = "slash" | "npm";

export type ActionCategory = "evaluation" | "pipeline" | "documents" | "maintenance" | "updates";

export interface ActionDefinition {
  id: string;
  category: ActionCategory;
  kind: ActionKind;
  /** Pour kind=slash : le nom du sous-mode (ex: "pdf"). Pour kind=npm : le nom du script npm. */
  command: string;
  title: string;
  description: string;
  /** Aide affichée sous le champ d'arguments. */
  argsHint?: string;
  /** Placeholder du textarea d'arguments. Si absent, le champ args est masqué. */
  argsPlaceholder?: string;
  argsRequired?: boolean;
  argsMultiline?: boolean;
  /** Indique si la commande consomme des crédits Claude (= peut bénéficier du sélecteur de modèle). */
  usesClaudeModel?: boolean;
  /** Avertissement à afficher avant exécution (ex. action destructive). */
  warning?: string;
  /** Icône (nom Lucide React). */
  iconName: string;
}

export const ACTION_CATEGORIES: Record<ActionCategory, { label: string; description: string }> = {
  evaluation: {
    label: "Évaluation & recherche",
    description: "Analyser une offre, un projet, une formation, une entreprise",
  },
  pipeline: {
    label: "Pipeline & relances",
    description: "Traiter les URLs en attente, contacter, relancer, préparer un entretien",
  },
  documents: {
    label: "Documents",
    description: "Générer CV, lettre, version LaTeX",
  },
  maintenance: {
    label: "Maintenance",
    description: "Vérifier, normaliser, dédoublonner les données",
  },
  updates: {
    label: "Mises à jour career-ops",
    description: "Mettre à jour le système career-ops du profil",
  },
};

export const ACTIONS: ActionDefinition[] = [
  // ==== Slash commands — évaluation
  {
    id: "pdf",
    category: "documents",
    kind: "slash",
    command: "pdf",
    title: "Générer un CV PDF adapté",
    description:
      "Crée un CV en PDF spécifiquement adapté à une offre. Compatible ATS (les logiciels RH qui filtrent automatiquement les CV avant qu'un humain les lise). Reprend les mots-clés clés de l'annonce.",
    argsPlaceholder: "URL de l'annonce, texte du JD, ou laisse vide pour utiliser la dernière évaluée",
    argsHint: "Le PDF est sauvegardé dans output/ — visible dans le module Documents.",
    argsRequired: false,
    usesClaudeModel: true,
    iconName: "FileText",
  },
  {
    id: "latex",
    category: "documents",
    kind: "slash",
    command: "latex",
    title: "CV au format LaTeX (typographie pro)",
    description:
      "Alternative au CV Word : LaTeX produit une mise en page très soignée, popularisée par les ingénieurs et chercheurs. Génère un fichier .tex (modifiable sur Overleaf, l'éditeur en ligne) puis le compile en PDF.",
    argsPlaceholder: "URL de l'annonce ou texte du JD (optionnel)",
    argsHint: "Ignore cette action si tu n'as pas déjà utilisé LaTeX — le CV PDF classique fait parfaitement l'affaire.",
    argsRequired: false,
    usesClaudeModel: true,
    iconName: "FileCode2",
  },
  {
    id: "batch",
    category: "evaluation",
    kind: "slash",
    command: "batch",
    title: "Évaluation en masse",
    description: "Traite plusieurs offres en parallèle via sub-agents. Très utile après un gros scan.",
    argsPlaceholder: "Liste d'URLs ou laisse vide pour utiliser data/pipeline.md",
    argsMultiline: true,
    argsRequired: false,
    usesClaudeModel: true,
    iconName: "Layers",
  },
  {
    id: "ofertas",
    category: "evaluation",
    kind: "slash",
    command: "ofertas",
    title: "Comparer plusieurs offres",
    description: "Scoring matrix sur 10 dimensions pondérées pour 2-5 offres en parallèle.",
    argsPlaceholder: "URLs ou IDs des offres à comparer (une par ligne)",
    argsMultiline: true,
    argsRequired: true,
    usesClaudeModel: true,
    iconName: "GitCompare",
  },
  {
    id: "deep",
    category: "evaluation",
    kind: "slash",
    command: "deep",
    title: "Recherche approfondie d'entreprise",
    description: "Document de recherche complet sur une entreprise : actualité, finances, culture, équipe.",
    argsPlaceholder: "Nom de l'entreprise (ex. BNP Paribas, ES Bank)",
    argsRequired: true,
    usesClaudeModel: true,
    iconName: "Telescope",
  },
  {
    id: "training",
    category: "evaluation",
    kind: "slash",
    command: "training",
    title: "Évaluer une formation",
    description: "Vaut-il le coup ? Note sur 6 dimensions (alignement, signal recruteur, ROI, etc.)",
    argsPlaceholder: "Nom du cours, URL ou description",
    argsRequired: true,
    usesClaudeModel: true,
    iconName: "GraduationCap",
  },
  {
    id: "project",
    category: "evaluation",
    kind: "slash",
    command: "project",
    title: "Évaluer un projet portfolio",
    description: "Scoring d'un projet à inclure dans ton CV (signal pour les rôles cibles, unicité, impact).",
    argsPlaceholder: "Description du projet ou URL",
    argsMultiline: true,
    argsRequired: true,
    usesClaudeModel: true,
    iconName: "Briefcase",
  },

  // ==== Slash commands — pipeline
  {
    id: "pipeline",
    category: "pipeline",
    kind: "slash",
    command: "pipeline",
    title: "Traiter l'inbox d'URLs",
    description: "Évalue toutes les URLs en attente dans data/pipeline.md en parallèle. Lance le pipeline complet sur chacune.",
    argsRequired: false,
    usesClaudeModel: true,
    iconName: "Workflow",
  },
  {
    id: "apply",
    category: "pipeline",
    kind: "slash",
    command: "apply",
    title: "Assistant de candidature live",
    description: "Lit ce qui est à l'écran et génère les réponses pour chaque question du formulaire. Idéal pour Workday, Greenhouse.",
    argsPlaceholder: "ID de l'offre (optionnel) ou URL du formulaire",
    argsRequired: false,
    usesClaudeModel: true,
    iconName: "PencilLine",
  },
  {
    id: "contacto",
    category: "pipeline",
    kind: "slash",
    command: "contacto",
    title: "LinkedIn outreach (Power Move)",
    description: "Identifie les bonnes personnes (recruteur, manager, peers) et rédige un message personnalisé.",
    argsPlaceholder: "Entreprise et poste (ex. BNP Paribas — Conseiller clientèle)",
    argsRequired: true,
    usesClaudeModel: true,
    iconName: "Linkedin",
  },
  {
    id: "followup",
    category: "pipeline",
    kind: "slash",
    command: "followup",
    title: "Cadence de relances",
    description: "Liste les candidatures en attente de relance et propose un brouillon de message pour chacune.",
    argsRequired: false,
    usesClaudeModel: true,
    iconName: "BellRing",
  },
  {
    id: "interview-prep",
    category: "pipeline",
    kind: "slash",
    command: "interview-prep",
    title: "Préparation d'entretien",
    description: "Brief complet pour un entretien : entreprise, équipe, questions probables, stories STAR à utiliser.",
    argsPlaceholder: "Entreprise et poste (ex. Crédit Agricole — Conseiller patrimonial)",
    argsRequired: true,
    usesClaudeModel: true,
    iconName: "Mic",
  },
  {
    id: "patterns",
    category: "pipeline",
    kind: "slash",
    command: "patterns",
    title: "Analyse des patterns de rejet",
    description: "Repère les patterns dans tes candidatures (ce qui marche, ce qui rate). Identifie ce qui te fait perdre du temps.",
    argsRequired: false,
    usesClaudeModel: true,
    iconName: "TrendingUp",
  },

  // ==== NPM scripts — maintenance
  {
    id: "doctor",
    category: "maintenance",
    kind: "npm",
    command: "doctor",
    title: "Diagnostic complet",
    description: "Vérifie l'installation : Node, Playwright, fichiers de config, dépendances. Zéro consommation Claude.",
    iconName: "Stethoscope",
  },
  {
    id: "verify",
    category: "maintenance",
    kind: "npm",
    command: "verify",
    title: "Vérifier le pipeline",
    description: "Contrôle l'intégrité de data/applications.md et data/pipeline.md (formats, doublons potentiels).",
    iconName: "ShieldCheck",
  },
  {
    id: "normalize",
    category: "maintenance",
    kind: "npm",
    command: "normalize",
    title: "Normaliser les statuts",
    description: "Standardise les libellés de statuts dans applications.md (ex. \"applied\" / \"aplicado\" → \"Applied\").",
    iconName: "Wand2",
  },
  {
    id: "dedup",
    category: "maintenance",
    kind: "npm",
    command: "dedup",
    title: "Dédoublonner le tracker",
    description: "Supprime les entrées en double dans data/applications.md.",
    iconName: "Filter",
  },
  {
    id: "merge",
    category: "maintenance",
    kind: "npm",
    command: "merge",
    title: "Fusionner les sorties batch",
    description: "Fusionne les fichiers générés par les workers batch dans le tracker principal.",
    iconName: "Merge",
  },
  {
    id: "sync-check",
    category: "maintenance",
    kind: "npm",
    command: "sync-check",
    title: "Vérifier la sync du CV",
    description: "Détecte si cv.md et modes/_profile.md sont désynchronisés.",
    iconName: "RefreshCw",
  },
  {
    id: "liveness",
    category: "maintenance",
    kind: "npm",
    command: "liveness",
    title: "Vérifier que les annonces sont en ligne",
    description: "Teste chaque URL du tracker pour voir si l'offre est toujours active (HTTP 200 vs 410).",
    iconName: "Activity",
  },

  // ==== NPM scripts — mises à jour
  {
    id: "update-check",
    category: "updates",
    kind: "npm",
    command: "update:check",
    title: "Vérifier les mises à jour",
    description: "Liste les changements disponibles depuis ta version actuelle de career-ops, sans rien appliquer.",
    iconName: "BellDot",
  },
  {
    id: "update-apply",
    category: "updates",
    kind: "npm",
    command: "update",
    title: "Appliquer les mises à jour",
    description: "Met à jour les fichiers système career-ops (modes/, scripts) en préservant tes fichiers utilisateur (cv.md, configs).",
    warning: "Sauvegarde la version actuelle. Tu pourras revenir en arrière avec « Rollback ».",
    iconName: "Download",
  },
  {
    id: "rollback",
    category: "updates",
    kind: "npm",
    command: "rollback",
    title: "Annuler la dernière mise à jour",
    description: "Restaure les fichiers système à l'état d'avant le dernier `update`.",
    warning: "Action irréversible une fois exécutée.",
    iconName: "Undo2",
  },
];

export function actionsByCategory(): Record<ActionCategory, ActionDefinition[]> {
  const grouped: Record<ActionCategory, ActionDefinition[]> = {
    evaluation: [],
    pipeline: [],
    documents: [],
    maintenance: [],
    updates: [],
  };
  for (const a of ACTIONS) grouped[a.category].push(a);
  return grouped;
}

export function getAction(id: string): ActionDefinition | undefined {
  return ACTIONS.find((a) => a.id === id);
}
