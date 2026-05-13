import { NextRequest } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { readAppConfig, updateAppConfig } from "@/lib/app-config";
import { runCommand, createSseStream } from "@/lib/cli";
import { checkWorkspace, getCareerOpsPath } from "@/lib/workspace";
import { buildProfileYaml, buildPortalsYaml } from "@/lib/yaml-builders";
import { WizardPreferences } from "@/lib/preferences";
import { Workspace } from "@/types/workspace";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 600;

interface ProvisionPayload {
  workspaceId: string;
  cvMarkdown: string;
  profileYaml: string;
  preferences: WizardPreferences;
  enabledSources: string[];
}

const CAREER_OPS_REPO = "https://github.com/santifer/career-ops.git";

export async function POST(req: NextRequest) {
  const payload = (await req.json()) as ProvisionPayload;

  return createSseStream(async (emit) => {
    const config = await readAppConfig();
    const workspace = config.workspaces.find((w) => w.id === payload.workspaceId);
    if (!workspace) {
      emit({ type: "error", message: "Profil introuvable." });
      return;
    }

    const careerOpsPath = getCareerOpsPath(workspace);
    const wsPath = workspace.path;

    try {
      emit({ type: "step", message: "Étape 1/5 — Clonage du dépôt career-ops" });
      const cloneExists = await pathExists(careerOpsPath);
      if (cloneExists) {
        emit({ type: "info", message: "Le dossier career-ops existe déjà, on saute le clone." });
      } else {
        const clone = await runCommand("git", ["clone", "--depth", "1", CAREER_OPS_REPO, careerOpsPath], {
          cwd: wsPath,
          onEvent: (e) => {
            if (e.type === "stderr" || e.type === "stdout") {
              emit({ type: "log", message: e.data.trim() });
            }
          },
          timeout: 5 * 60 * 1000,
        });
        if (clone.exitCode !== 0) {
          emit({ type: "error", message: "Le clone a échoué. Vérifie ta connexion réseau et que git est installé." });
          return;
        }
      }
      emit({ type: "success", message: "Dépôt cloné" });

      emit({ type: "step", message: "Étape 2/5 — Installation des dépendances npm (peut prendre 1-2 min)" });
      const npmInstall = await runCommand("npm", ["install", "--silent"], {
        cwd: careerOpsPath,
        onEvent: (e) => {
          if (e.type === "stdout" || e.type === "stderr") {
            const trimmed = e.data.trim();
            if (trimmed) emit({ type: "log", message: trimmed.slice(0, 500) });
          }
        },
        timeout: 8 * 60 * 1000,
      });
      if (npmInstall.exitCode !== 0) {
        emit({ type: "warn", message: "npm install a renvoyé un code non zéro. On continue." });
      } else {
        emit({ type: "success", message: "Dépendances installées" });
      }

      emit({ type: "step", message: "Étape 3/5 — Écriture du CV et de la configuration" });
      await fs.writeFile(path.join(careerOpsPath, "cv.md"), payload.cvMarkdown, "utf-8");
      emit({ type: "info", message: "cv.md écrit" });

      const profileYaml = await mergeWizardIntoProfile(payload.profileYaml, payload.preferences);
      await fs.mkdir(path.join(careerOpsPath, "config"), { recursive: true });
      await fs.writeFile(path.join(careerOpsPath, "config", "profile.yml"), profileYaml, "utf-8");
      emit({ type: "info", message: "config/profile.yml écrit" });

      const portalsYaml = buildPortalsYaml(payload.enabledSources, payload.preferences);
      await fs.writeFile(path.join(careerOpsPath, "portals.yml"), portalsYaml, "utf-8");
      emit({ type: "info", message: "portals.yml écrit" });

      emit({ type: "success", message: "Configuration écrite" });

      emit({ type: "step", message: "Étape 4/5 — Installation de Playwright (Chromium)" });
      const playwright = await runCommand("npx", ["--yes", "playwright", "install", "chromium"], {
        cwd: careerOpsPath,
        onEvent: (e) => {
          if (e.type === "stdout" || e.type === "stderr") {
            const trimmed = e.data.trim();
            if (trimmed) emit({ type: "log", message: trimmed.slice(0, 300) });
          }
        },
        timeout: 5 * 60 * 1000,
      });
      if (playwright.exitCode !== 0) {
        emit({
          type: "warn",
          message: "Playwright a renvoyé un code non zéro. La génération de PDF pourrait ne pas fonctionner.",
        });
      } else {
        emit({ type: "success", message: "Playwright installé" });
      }

      emit({ type: "step", message: "Étape 5/5 — Vérification finale (npm run doctor)" });
      const doctor = await runCommand("npm", ["run", "doctor"], {
        cwd: careerOpsPath,
        onEvent: (e) => {
          if (e.type === "stdout" || e.type === "stderr") {
            const trimmed = e.data.trim();
            if (trimmed) emit({ type: "log", message: trimmed.slice(0, 300) });
          }
        },
        timeout: 60 * 1000,
      });

      const check = await checkWorkspace(wsPath);
      await updateAppConfig((current) => ({
        ...current,
        activeWorkspaceId: workspace.id,
        workspaces: current.workspaces.map((w) =>
          w.id === workspace.id
            ? ({
                ...w,
                health: check.health,
                healthDetails: check.details,
                lastUsedAt: new Date().toISOString(),
              } as Workspace)
            : w
        ),
      }));

      if (doctor.exitCode === 0 && check.health === "ok") {
        emit({ type: "success", message: "Profil opérationnel" });
      } else {
        emit({
          type: "warn",
          message: `Profil créé avec avertissements : ${check.details}`,
        });
      }

      emit({ type: "done", message: "Provisionnement terminé", meta: { workspaceId: workspace.id, health: check.health } });
    } catch (err) {
      emit({
        type: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  });
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function mergeWizardIntoProfile(profileYaml: string, preferences: WizardPreferences): Promise<string> {
  const yamlModule = await import("yaml");
  const parsed = (yamlModule.default.parse(profileYaml) ?? {}) as Record<string, unknown>;
  return buildProfileYaml(parsed, preferences);
}
