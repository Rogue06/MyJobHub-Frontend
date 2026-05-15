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
  model?: ClaudeModelChoice;
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = (await req.json().catch(() => ({}))) as Payload;
  const scanMode = body.scanMode ?? "agent";
  const model = body.model ?? "default";

  return createSseStream(async (emit) => {
    const config = await readAppConfig();
    const workspace = config.workspaces.find((w) => w.id === params.id);
    if (!workspace) {
      emit({ type: "error", message: "Profil introuvable." });
      return;
    }

    const careerOpsPath = getCareerOpsPath(workspace);

    if (scanMode === "agent" || true) {
      const ok = await isClaudeAvailable();
      if (!ok) {
        emit({
          type: "error",
          message: "Claude Code CLI introuvable. Vérifie l'installation (`claude --version`).",
        });
        return;
      }
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
      const scanArgs: string[] = scanMode === "fast" ? ["run", "scan"] : buildClaudeArgs("/career-ops scan", model);
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

    // ÉTAPE 2 : Pipeline d'évaluation
    emit({
      type: "step",
      message: "Étape 2/2 — Évaluation de toutes les URLs de l'inbox (IA, modèle " + model + ")",
    });
    emit({
      type: "info",
      message: "Chaque URL est évaluée selon ton profil. CV adaptés et lettres sont générés en parallèle.",
    });

    const pipelineResult = await runCommand("claude", buildClaudeArgs("/career-ops pipeline", model), {
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
      timeout: 25 * 60 * 1000,
    });

    if (pipelineResult.exitCode === 0) {
      emit({
        type: "success",
        message:
          "✓ Tout est traité ! Va voir « Candidatures » pour les scores et « Documents » pour les CV adaptés.",
      });
    } else {
      emit({ type: "error", message: `Le pipeline a renvoyé le code ${pipelineResult.exitCode}.` });
    }

    emit({
      type: "done",
      message: "Workflow terminé",
      meta: { exitCode: pipelineResult.exitCode },
    });
  });
}
