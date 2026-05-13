import { promises as fs } from "node:fs";
import path from "node:path";
import { Workspace, WorkspaceHealth } from "@/types/workspace";

export interface WorkspaceCheck {
  health: WorkspaceHealth;
  details: string;
  hasCareerOps: boolean;
  hasProfile: boolean;
  hasPortals: boolean;
  hasCv: boolean;
  hasNodeModules: boolean;
}

export async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export async function isCareerOpsClone(dirPath: string): Promise<boolean> {
  const [hasModes, hasPackage] = await Promise.all([
    pathExists(path.join(dirPath, "modes")),
    pathExists(path.join(dirPath, "package.json")),
  ]);
  return hasModes && hasPackage;
}

export async function detectCareerOpsRelPath(workspacePath: string): Promise<string | null> {
  if (await isCareerOpsClone(workspacePath)) return ".";
  if (await isCareerOpsClone(path.join(workspacePath, "career-ops"))) return "career-ops";
  return null;
}

export async function resolveCareerOpsPath(workspace: Workspace): Promise<string> {
  return getCareerOpsPath(workspace);
}

export async function checkWorkspace(
  workspacePath: string,
  careerOpsRelPath?: string
): Promise<WorkspaceCheck> {
  const rel = careerOpsRelPath ?? "career-ops";
  const careerOpsPath = rel === "." || rel === "" ? workspacePath : path.join(workspacePath, rel);

  const hasCareerOps = await pathExists(careerOpsPath);
  if (!hasCareerOps) {
    return {
      health: "error",
      details: "Le dossier career-ops est introuvable. Le profil n'est pas encore initialisé.",
      hasCareerOps: false,
      hasProfile: false,
      hasPortals: false,
      hasCv: false,
      hasNodeModules: false,
    };
  }

  const [hasProfile, hasPortals, hasCv, hasNodeModules] = await Promise.all([
    pathExists(path.join(careerOpsPath, "config", "profile.yml")),
    pathExists(path.join(careerOpsPath, "portals.yml")),
    pathExists(path.join(careerOpsPath, "cv.md")),
    pathExists(path.join(careerOpsPath, "node_modules")),
  ]);

  const missing: string[] = [];
  if (!hasProfile) missing.push("config/profile.yml");
  if (!hasPortals) missing.push("portals.yml");
  if (!hasCv) missing.push("cv.md");
  if (!hasNodeModules) missing.push("node_modules (npm install requis)");

  let health: WorkspaceHealth = "ok";
  let details = "Profil prêt à l'emploi.";

  if (missing.length > 0) {
    if (!hasNodeModules || missing.length >= 3) {
      health = "error";
      details = `Fichiers ou dépendances manquants : ${missing.join(", ")}`;
    } else {
      health = "warning";
      details = `Fichiers manquants : ${missing.join(", ")}`;
    }
  }

  return {
    health,
    details,
    hasCareerOps,
    hasProfile,
    hasPortals,
    hasCv,
    hasNodeModules,
  };
}

export function getCareerOpsPath(workspace: Workspace): string {
  const rel = workspace.careerOpsRelPath ?? "career-ops";
  if (rel === "." || rel === "") return workspace.path;
  return path.join(workspace.path, rel);
}

export function getWorkspaceFile(workspace: Workspace, relativePath: string): string {
  return path.join(getCareerOpsPath(workspace), relativePath);
}

export function generateWorkspaceId(): string {
  return `ws_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
