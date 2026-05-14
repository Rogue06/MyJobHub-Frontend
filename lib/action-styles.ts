import { ActionCategory } from "@/lib/actions-catalog";

export interface CategoryStyle {
  /** Couleur d'accent pour l'icône et les hovers. */
  iconBg: string;
  iconText: string;
  ring: string;
  badgeBg: string;
}

export const CATEGORY_STYLES: Record<ActionCategory, CategoryStyle> = {
  evaluation: {
    iconBg: "bg-indigo-500/10",
    iconText: "text-indigo-600 dark:text-indigo-300",
    ring: "hover:ring-indigo-500/30",
    badgeBg: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
  },
  pipeline: {
    iconBg: "bg-purple-500/10",
    iconText: "text-purple-600 dark:text-purple-300",
    ring: "hover:ring-purple-500/30",
    badgeBg: "bg-purple-500/10 text-purple-700 dark:text-purple-300",
  },
  documents: {
    iconBg: "bg-emerald-500/10",
    iconText: "text-emerald-600 dark:text-emerald-300",
    ring: "hover:ring-emerald-500/30",
    badgeBg: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  maintenance: {
    iconBg: "bg-amber-500/10",
    iconText: "text-amber-600 dark:text-amber-300",
    ring: "hover:ring-amber-500/30",
    badgeBg: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  updates: {
    iconBg: "bg-rose-500/10",
    iconText: "text-rose-600 dark:text-rose-300",
    ring: "hover:ring-rose-500/30",
    badgeBg: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
  },
};
