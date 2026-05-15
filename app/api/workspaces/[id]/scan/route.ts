import { NextRequest } from "next/server";
import { readAppConfig } from "@/lib/app-config";
import { runCommand, createSseStream } from "@/lib/cli";
import { getCareerOpsPath } from "@/lib/workspace";
import { isClaudeAvailable, ClaudeModelChoice, buildClaudeArgs } from "@/lib/claude-runner";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 900;

interface ScanPayload {
  mode?: "fast" | "agent";
  model?: ClaudeModelChoice;
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = (await req.json().catch(() => ({}))) as ScanPayload;
  const mode = body.mode ?? "fast";
  const model = body.model ?? "default";

  return createSseStream(async (emit) => {
    const config = await readAppConfig();
    const workspace = config.workspaces.find((w) => w.id === params.id);
    if (!workspace) {
      emit({ type: "error", message: "Profil introuvable." });
      return;
    }

    const careerOpsPath = getCareerOpsPath(workspace);

    if (mode === "fast") {
      emit({ type: "step", message: "Scan rapide via les APIs Greenhouse / Ashby / Lever (zero-token)" });
      emit({
        type: "info",
        message:
          "Note : ce mode ignore les portails sans API (France Travail, APEC, sites carrières directs). Pour ceux-là, utilise le mode « complet ».",
      });

      const result = await runCommand("npm", ["run", "scan"], {
        cwd: careerOpsPath,
        onEvent: (e) => {
          if (e.type === "stdout") {
            const lines = e.data.split("\n");
            for (const l of lines) {
              const t = l.trim();
              if (t) emit({ type: "log", message: t.slice(0, 500) });
            }
          } else if (e.type === "stderr") {
            const t = e.data.trim();
            if (t) emit({ type: "warn", message: t.slice(0, 400) });
          }
        },
        timeout: 10 * 60 * 1000,
      });

      if (result.exitCode === 0) {
        emit({ type: "success", message: "Scan terminé. Nouvelles offres ajoutées à data/pipeline.md." });
      } else {
        emit({ type: "error", message: `Scan échoué (code ${result.exitCode}).` });
      }
      emit({ type: "done", message: "Terminé", meta: { exitCode: result.exitCode } });
      return;
    }

    if (mode === "agent") {
      const ok = await isClaudeAvailable();
      if (!ok) {
        emit({
          type: "error",
          message: "Claude CLI introuvable. Vérifie l'installation avec `claude --version`.",
        });
        return;
      }
      emit({
        type: "step",
        message: `Scan complet via Claude (Playwright + WebSearch). Modèle : ${model}. Cela peut prendre 5-10 min.`,
      });
      const claudeArgs = buildClaudeArgs("/career-ops scan", model);
      emit({
        type: "info",
        message: `Commande exacte : claude ${claudeArgs.map((a) => (a.startsWith("/") ? `"${a}"` : a)).join(" ")}`,
      });

      const result = await runCommand("claude", claudeArgs, {
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
            if (t) emit({ type: "warn", message: t.slice(0, 400) });
          }
        },
        timeout: 15 * 60 * 1000,
      });

      if (result.exitCode === 0) {
        emit({ type: "success", message: "Scan complet terminé." });
      } else {
        emit({ type: "error", message: `Claude a renvoyé le code ${result.exitCode}.` });
      }
      emit({ type: "done", message: "Terminé", meta: { exitCode: result.exitCode } });
      return;
    }

    emit({ type: "error", message: `Mode inconnu : ${mode}` });
  });
}
