"use client";

import { ACTIONS } from "@/lib/actions-catalog";
import { ClaudeModelChoice } from "@/lib/claude-models";

export const MODEL_PREFS_EVENT = "myjobhub:model-prefs-changed";

const ACTION_KEY = (id: string) => `myjobhub-model-action-${id}`;
const SCAN_KEY = "myjobhub-model-scan";
const EVALUATE_KEY = "myjobhub-model-evaluate";
const SCAN_DEFAULT_RECO: ClaudeModelChoice = "sonnet";
const EVALUATE_DEFAULT_RECO: ClaudeModelChoice = "sonnet";

export function emitModelPrefsChange(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(MODEL_PREFS_EVENT));
}

export function applyRecommendedModelsEverywhere(): { updated: number; total: number } {
  if (typeof window === "undefined") return { updated: 0, total: 0 };
  let updated = 0;
  let total = 0;
  for (const a of ACTIONS) {
    if (!a.usesClaudeModel) continue;
    total++;
    if (a.recommendedModel) {
      localStorage.setItem(ACTION_KEY(a.id), a.recommendedModel);
      updated++;
    }
  }
  total += 2;
  localStorage.setItem(SCAN_KEY, SCAN_DEFAULT_RECO);
  localStorage.setItem(EVALUATE_KEY, EVALUATE_DEFAULT_RECO);
  updated += 2;
  emitModelPrefsChange();
  return { updated, total };
}

export function resetAllModelPrefs(): void {
  if (typeof window === "undefined") return;
  for (const a of ACTIONS) {
    localStorage.removeItem(ACTION_KEY(a.id));
  }
  localStorage.removeItem(SCAN_KEY);
  localStorage.removeItem(EVALUATE_KEY);
  emitModelPrefsChange();
}

export function countRecommendationsApplied(): { applied: number; total: number } {
  if (typeof window === "undefined") return { applied: 0, total: 0 };
  let applied = 0;
  let total = 0;
  for (const a of ACTIONS) {
    if (!a.usesClaudeModel || !a.recommendedModel) continue;
    total++;
    const current = localStorage.getItem(ACTION_KEY(a.id));
    if (current === a.recommendedModel) applied++;
  }
  return { applied, total };
}
