export type ClaudeModelChoice = "default" | "opus" | "sonnet" | "haiku";

export const CLAUDE_MODEL_OPTIONS: { id: ClaudeModelChoice; label: string; description: string }[] = [
  {
    id: "default",
    label: "Modèle par défaut",
    description: "Utilise le réglage de ton Claude Code CLI",
  },
  {
    id: "opus",
    label: "Opus (le plus puissant)",
    description: "Meilleure qualité, plus coûteux",
  },
  {
    id: "sonnet",
    label: "Sonnet (équilibré)",
    description: "Bon ratio qualité / coût",
  },
  {
    id: "haiku",
    label: "Haiku (rapide & économique)",
    description: "Plus rapide, moins cher, qualité moindre",
  },
];
