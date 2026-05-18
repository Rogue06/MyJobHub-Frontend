import { NextRequest } from "next/server";
import { readAppConfig } from "@/lib/app-config";
import { runCommand, createSseStream } from "@/lib/cli";
import { getCareerOpsPath } from "@/lib/workspace";
import { isClaudeAvailable, buildClaudeArgs } from "@/lib/claude-runner";
import { ClaudeModelChoice } from "@/lib/claude-models";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 1800; // 30 min max

interface Payload {
  urls: string[];
  model?: ClaudeModelChoice;
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = (await req.json()) as Payload;
  const urls = (body.urls ?? []).map((u) => u.trim()).filter((u) => u.length > 0);
  const model = body.model ?? "default";

  return createSseStream(async (emit) => {
    const config = await readAppConfig();
    const workspace = config.workspaces.find((w) => w.id === params.id);
    if (!workspace) {
      emit({ type: "error", message: "Profil introuvable." });
      return;
    }
    if (urls.length === 0) {
      emit({ type: "error", message: "Aucune URL sélectionnée." });
      return;
    }

    const ok = await isClaudeAvailable();
    if (!ok) {
      emit({
        type: "error",
        message: "Claude Code CLI introuvable.",
      });
      return;
    }

    const careerOpsPath = getCareerOpsPath(workspace);

    emit({
      type: "step",
      message: `Génération CV + lettre pour ${urls.length} offre${urls.length > 1 ? "s" : ""} sélectionnée${urls.length > 1 ? "s" : ""}`,
    });
    emit({
      type: "info",
      message: `Modèle : ${model}. Pour chaque offre : évaluation détaillée A-F, CV ATS adapté, lettre de motivation, plan STAR. ~3-5 min par offre.`,
    });

    let success = 0;
    let failed = 0;

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      const shortUrl = url.length > 60 ? url.slice(0, 60) + "…" : url;
      emit({
        type: "step",
        message: `[${i + 1}/${urls.length}] Pipeline complet pour ${shortUrl}`,
      });

      const prompt = `/career-ops ${url}`;
      const args = buildClaudeArgs(prompt, model);

      const result = await runCommand("claude", args, {
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
        timeout: 8 * 60 * 1000,
      });

      if (result.exitCode === 0) {
        success++;
        emit({ type: "success", message: `✓ Offre ${i + 1}/${urls.length} traitée` });
      } else {
        failed++;
        emit({ type: "warn", message: `Offre ${i + 1}/${urls.length} : code de sortie ${result.exitCode}` });
      }
    }

    if (success > 0) {
      emit({
        type: "success",
        message: `Terminé. ${success}/${urls.length} pipeline${success > 1 ? "s" : ""} complet${success > 1 ? "s" : ""} avec succès.${failed > 0 ? ` ${failed} échec${failed > 1 ? "s" : ""}.` : ""} Va voir Candidatures et Documents.`,
      });
    } else {
      emit({
        type: "error",
        message: `Aucune offre n'a pu être traitée correctement (${failed}/${urls.length} échecs).`,
      });
    }

    emit({
      type: "done",
      message: "Génération terminée",
      meta: { success, failed, total: urls.length },
    });
  });
}
