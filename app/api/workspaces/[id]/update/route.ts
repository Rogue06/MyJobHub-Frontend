import { NextRequest } from "next/server";
import { readAppConfig } from "@/lib/app-config";
import { runCommand, createSseStream } from "@/lib/cli";
import { getCareerOpsPath } from "@/lib/workspace";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 600;

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const config = await readAppConfig();
  const workspace = config.workspaces.find((w) => w.id === params.id);

  return createSseStream(async (emit) => {
    if (!workspace) {
      emit({ type: "error", message: "Profil introuvable." });
      return;
    }
    const careerOpsPath = getCareerOpsPath(workspace);

    emit({ type: "step", message: "Vérification du dépôt git…" });
    const statusRes = await runCommand("git", ["status", "--porcelain"], {
      cwd: careerOpsPath,
      timeout: 15000,
    });
    if (statusRes.exitCode !== 0) {
      emit({ type: "error", message: "Le dossier career-ops n'est pas un dépôt git valide." });
      return;
    }
    if (statusRes.stdout.trim()) {
      emit({
        type: "warn",
        message: "Des fichiers locaux sont modifiés (ex. cv.md, profile.yml). Ils ne seront pas écrasés.",
      });
    }

    emit({ type: "step", message: "Récupération des dernières modifications (git pull)…" });
    const pull = await runCommand("git", ["pull", "--rebase", "--autostash"], {
      cwd: careerOpsPath,
      onEvent: (e) => {
        if (e.type === "stdout" || e.type === "stderr") {
          const t = e.data.trim();
          if (t) emit({ type: "log", message: t.slice(0, 300) });
        }
      },
      timeout: 2 * 60 * 1000,
    });

    if (pull.exitCode !== 0) {
      emit({
        type: "error",
        message:
          "Le git pull a échoué. Vérifie le dépôt manuellement ou ajoute l'upstream santifer/career-ops.",
      });
      return;
    }
    emit({ type: "success", message: "Dépôt à jour" });

    emit({ type: "step", message: "Réinstallation des dépendances npm…" });
    const install = await runCommand("npm", ["install", "--silent"], {
      cwd: careerOpsPath,
      onEvent: (e) => {
        if (e.type === "stdout" || e.type === "stderr") {
          const t = e.data.trim();
          if (t) emit({ type: "log", message: t.slice(0, 300) });
        }
      },
      timeout: 5 * 60 * 1000,
    });
    if (install.exitCode !== 0) {
      emit({ type: "warn", message: "npm install a renvoyé un code non zéro." });
    } else {
      emit({ type: "success", message: "Dépendances à jour" });
    }

    emit({ type: "step", message: "Vérification (npm run doctor)…" });
    const doctor = await runCommand("npm", ["run", "doctor"], {
      cwd: careerOpsPath,
      onEvent: (e) => {
        if (e.type === "stdout" || e.type === "stderr") {
          const t = e.data.trim();
          if (t) emit({ type: "log", message: t.slice(0, 300) });
        }
      },
      timeout: 60 * 1000,
    });
    if (doctor.exitCode === 0) {
      emit({ type: "success", message: "Tout est sain" });
    }

    emit({ type: "done", message: "Mise à jour terminée" });
  });
}
