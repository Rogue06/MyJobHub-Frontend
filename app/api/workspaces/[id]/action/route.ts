import { NextRequest } from "next/server";
import { readAppConfig } from "@/lib/app-config";
import { runCommand, createSseStream } from "@/lib/cli";
import { getCareerOpsPath } from "@/lib/workspace";
import { isClaudeAvailable, buildClaudeArgs } from "@/lib/claude-runner";
import { ClaudeModelChoice } from "@/lib/claude-models";
import { getAction } from "@/lib/actions-catalog";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 900;

interface ActionPayload {
  actionId: string;
  args?: string;
  model?: ClaudeModelChoice;
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = (await req.json()) as ActionPayload;
  const action = getAction(body.actionId);

  return createSseStream(async (emit) => {
    if (!action) {
      emit({ type: "error", message: `Action inconnue : ${body.actionId}` });
      return;
    }

    const config = await readAppConfig();
    const workspace = config.workspaces.find((w) => w.id === params.id);
    if (!workspace) {
      emit({ type: "error", message: "Profil introuvable." });
      return;
    }

    const careerOpsPath = getCareerOpsPath(workspace);
    const args = (body.args ?? "").trim();

    if (action.argsRequired && args.length === 0) {
      emit({ type: "error", message: "Cette action requiert un argument (URL, entreprise…)." });
      return;
    }

    if (action.kind === "slash") {
      const ok = await isClaudeAvailable();
      if (!ok) {
        emit({
          type: "error",
          message: "Claude Code CLI introuvable. Vérifie l'installation (`claude --version`).",
        });
        return;
      }

      const model = body.model ?? "default";
      const prompt = args.length > 0 ? `/career-ops ${action.command} ${args}` : `/career-ops ${action.command}`;
      emit({
        type: "step",
        message: `Lancement de \`/career-ops ${action.command}\` (modèle : ${model}).`,
      });

      const result = await runCommand("claude", buildClaudeArgs(prompt, model), {
        cwd: careerOpsPath,
        onEvent: (e) => {
          if (e.type === "stdout") {
            const lines = e.data.split("\n");
            for (const l of lines) {
              const t = l.trim();
              if (t) emit({ type: "log", message: t.slice(0, 800) });
            }
          } else if (e.type === "stderr") {
            const t = e.data.trim();
            if (t) emit({ type: "warn", message: t.slice(0, 500) });
          }
        },
        timeout: 15 * 60 * 1000,
      });

      if (result.exitCode === 0) {
        emit({ type: "success", message: "Action terminée." });
      } else {
        emit({ type: "error", message: `Claude a renvoyé le code ${result.exitCode}.` });
      }
      emit({ type: "done", message: "Terminé", meta: { exitCode: result.exitCode } });
      return;
    }

    if (action.kind === "npm") {
      emit({ type: "step", message: `Lancement de \`npm run ${action.command}\`.` });

      const result = await runCommand("npm", ["run", action.command], {
        cwd: careerOpsPath,
        onEvent: (e) => {
          if (e.type === "stdout") {
            const lines = e.data.split("\n");
            for (const l of lines) {
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

      if (result.exitCode === 0) {
        emit({ type: "success", message: "Script terminé." });
      } else {
        emit({ type: "error", message: `Le script a renvoyé le code ${result.exitCode}.` });
      }
      emit({ type: "done", message: "Terminé", meta: { exitCode: result.exitCode } });
      return;
    }

    emit({ type: "error", message: `Type d'action non supporté : ${action.kind}` });
  });
}
