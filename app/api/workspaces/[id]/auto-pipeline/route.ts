import { NextRequest } from "next/server";
import { readAppConfig } from "@/lib/app-config";
import { runCommand, createSseStream } from "@/lib/cli";
import { getCareerOpsPath } from "@/lib/workspace";
import { isClaudeAvailable, buildClaudeArgs } from "@/lib/claude-runner";
import { ClaudeModelChoice } from "@/lib/claude-models";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 1800; // 30 minutes

interface Payload {
  scanMode?: "fast" | "agent" | "skip";
  evalMode?: "complete" | "light";
  model?: ClaudeModelChoice;
}

const LIGHT_EVAL_PROMPT = `Tu vas effectuer une évaluation RAPIDE et ÉCONOMIQUE des offres en attente. Le but est de pré-filtrer pour économiser les tokens : pas de génération lourde, juste assez pour que l'utilisateur décide.

## Procédure

1. Lis \`data/pipeline.md\` et prends toutes les URLs marquées \`- [ ]\` (Pendientes).
2. Lis \`cv.md\` et \`config/profile.yml\` pour le contexte (une seule fois).
3. Pour chaque URL en attente, en parallèle si possible :
   a. Extrais le JD (Playwright > WebFetch > WebSearch — si page non accessible, marque \`- [!]\` avec note).
   b. Calcule UN score sur 5 (règles A-F de \`modes/_shared.md\`).
   c. Identifie 2-3 bloquants ou forces majeurs (très bref).
   d. Recommandation : POSTULER (≥ 4) / À VOIR (3-4) / SKIP (< 3).
4. Mets à jour \`data/pipeline.md\` : déplace chaque URL de "Pendientes" vers "Procesadas" avec le format :
   \`- [x] #NNN | URL | Entreprise | Rôle | Score/5 | LIGHT\`
   (Le suffixe LIGHT indique que c'est une éval rapide, sans rapport détaillé.)

## CE QUE TU NE FAIS PAS

- ❌ Pas de rapport détaillé dans \`reports/\` (ni .md ni .pdf).
- ❌ Pas de CV adapté dans \`output/\`.
- ❌ Pas de lettre de motivation.
- ❌ Pas de plan d'entretien STAR.
- ❌ Pas de comp research approfondie.
- ❌ Pas d'ajout dans \`data/applications.md\` (le tracker reste pour les vraies candidatures).

## Sortie finale

Affiche un tableau Markdown récapitulatif :

\`\`\`
| # | Entreprise | Rôle | Lieu | Salaire | Score | Recommandation | Bloquants/Forces |
\`\`\`

L'utilisateur le lira, choisira les offres intéressantes et lancera ensuite le pipeline complet (\`/career-ops <URL>\`) seulement sur celles-là.

Si peu d'URLs (< 3), traite-les en série. Si 3+, lance des sub-agents en parallèle.`;

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = (await req.json().catch(() => ({}))) as Payload;
  const scanMode = body.scanMode ?? "agent";
  const evalMode = body.evalMode ?? "complete";
  const model = body.model ?? "default";

  return createSseStream(async (emit) => {
    const config = await readAppConfig();
    const workspace = config.workspaces.find((w) => w.id === params.id);
    if (!workspace) {
      emit({ type: "error", message: "Profil introuvable." });
      return;
    }

    const careerOpsPath = getCareerOpsPath(workspace);

    const ok = await isClaudeAvailable();
    if (!ok) {
      emit({
        type: "error",
        message: "Claude Code CLI introuvable. Vérifie l'installation (`claude --version`).",
      });
      return;
    }

    // ÉTAPE 1 : Scan
    if (scanMode !== "skip") {
      emit({
        type: "step",
        message: `Étape 1/2 — ${
          scanMode === "fast"
            ? "Scan rapide (APIs Greenhouse/Ashby/Lever)"
            : "Scan complet (IA, Playwright + WebSearch)"
        }`,
      });

      const scanBin: string = scanMode === "fast" ? "npm" : "claude";
      const scanArgs: string[] =
        scanMode === "fast" ? ["run", "scan"] : buildClaudeArgs("/career-ops scan", model);
      emit({
        type: "info",
        message: `Commande lancée : ${scanBin} ${scanArgs
          .map((a) => (a.startsWith("/") ? `"${a}"` : a))
          .join(" ")}`,
      });
      const scanResult = await runCommand(scanBin, scanArgs, {
        cwd: careerOpsPath,
        onEvent: (e) => {
          if (e.type === "stdout") {
            for (const l of e.data.split("\n")) {
              const t = l.trim();
              if (t) emit({ type: "log", message: t.slice(0, 600) });
            }
          } else if (e.type === "stderr") {
            const t = e.data.trim();
            if (t) emit({ type: "warn", message: t.slice(0, 500) });
          }
        },
        timeout: 15 * 60 * 1000,
      });

      if (scanResult.exitCode !== 0) {
        emit({ type: "error", message: `Scan échoué (code ${scanResult.exitCode}). Étape suivante annulée.` });
        emit({ type: "done", message: "Terminé avec erreur", meta: { exitCode: scanResult.exitCode } });
        return;
      }
      emit({ type: "success", message: "Scan terminé." });
    } else {
      emit({ type: "info", message: "Scan ignoré — on traite directement les URLs déjà dans l'inbox." });
    }

    // ÉTAPE 2 : Évaluation (complète ou light)
    const isLight = evalMode === "light";
    emit({
      type: "step",
      message: isLight
        ? `Étape 2/2 — Évaluation RAPIDE (économique) des URLs de l'inbox (modèle ${model})`
        : `Étape 2/2 — Évaluation complète des URLs de l'inbox (modèle ${model})`,
    });
    emit({
      type: "info",
      message: isLight
        ? "Mode économique : score + résumé court uniquement. Pas de génération de CV/lettre/rapport détaillé."
        : "Chaque URL est évaluée intégralement. CV adaptés et lettres générés en parallèle.",
    });

    const evalPrompt = isLight ? LIGHT_EVAL_PROMPT : "/career-ops pipeline";
    const evalArgs = buildClaudeArgs(evalPrompt, model);
    emit({
      type: "info",
      message: isLight
        ? `Commande lancée : claude (avec prompt léger MyJobHub, modèle ${model})`
        : `Commande lancée : claude ${evalArgs
            .map((a) => (a.startsWith("/") ? `"${a}"` : a))
            .join(" ")}`,
    });

    const evalResult = await runCommand("claude", evalArgs, {
      cwd: careerOpsPath,
      onEvent: (e) => {
        if (e.type === "stdout") {
          for (const l of e.data.split("\n")) {
            const t = l.trim();
            if (t) emit({ type: "log", message: t.slice(0, 600) });
          }
        } else if (e.type === "stderr") {
          const t = e.data.trim();
          if (t) emit({ type: "warn", message: t.slice(0, 500) });
        }
      },
      timeout: isLight ? 15 * 60 * 1000 : 25 * 60 * 1000,
    });

    if (evalResult.exitCode === 0) {
      emit({
        type: "success",
        message: isLight
          ? "✓ Évaluation rapide terminée. Va voir « Triage » pour repérer les offres intéressantes, puis lance le pipeline complet sur celles-là."
          : "✓ Tout est traité ! Va voir « Candidatures » pour les scores et « Documents » pour les CV adaptés.",
      });
    } else {
      emit({ type: "error", message: `L'évaluation a renvoyé le code ${evalResult.exitCode}.` });
    }

    emit({
      type: "done",
      message: "Workflow terminé",
      meta: { exitCode: evalResult.exitCode },
    });
  });
}
