import { NextRequest } from "next/server";
import { readAppConfig } from "@/lib/app-config";
import { runCommand, createSseStream } from "@/lib/cli";
import { getCareerOpsPath } from "@/lib/workspace";
import { isClaudeAvailable } from "@/lib/claude-runner";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 900;

interface EvaluatePayload {
  content: string;
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = (await req.json()) as EvaluatePayload;

  return createSseStream(async (emit) => {
    const config = await readAppConfig();
    const workspace = config.workspaces.find((w) => w.id === params.id);
    if (!workspace) {
      emit({ type: "error", message: "Profil introuvable." });
      return;
    }
    if (!payload.content || payload.content.trim().length < 10) {
      emit({ type: "error", message: "Contenu de l'offre trop court (URL ou texte requis)." });
      return;
    }

    const careerOpsPath = getCareerOpsPath(workspace);

    const claudeOk = await isClaudeAvailable();
    if (!claudeOk) {
      emit({
        type: "error",
        message: "Claude Code CLI introuvable. Vérifie qu'il est installé et que tu es connecté (`claude --version`).",
      });
      return;
    }

    const prompt = `/career-ops ${payload.content.trim()}`;

    emit({ type: "step", message: "Lancement de l'évaluation par Claude…" });
    emit({ type: "info", message: `Commande : claude -p "/career-ops …" (dans ${careerOpsPath})` });

    const result = await runCommand(
      "claude",
      ["-p", prompt],
      {
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
      }
    );

    if (result.exitCode === 0) {
      emit({ type: "success", message: "Évaluation terminée" });
    } else {
      emit({ type: "error", message: `Claude a renvoyé le code ${result.exitCode}.` });
    }

    emit({ type: "done", message: "Terminé", meta: { exitCode: result.exitCode } });
  });
}
