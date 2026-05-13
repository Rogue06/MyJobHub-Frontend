import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { readAppConfig, updateAppConfig } from "@/lib/app-config";
import {
  checkWorkspace,
  detectCareerOpsRelPath,
  generateWorkspaceId,
  isCareerOpsClone,
  pathExists,
} from "@/lib/workspace";
import { expandHome } from "@/lib/paths";
import { Workspace } from "@/types/workspace";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface CheckResult {
  ok: boolean;
  layout: "nested" | "flat" | "none";
  resolvedWorkspacePath: string | null;
  careerOpsRelPath: string | null;
  details: {
    hasModes: boolean;
    hasPackageJson: boolean;
    hasCv: boolean;
    hasProfile: boolean;
    hasPortals: boolean;
    hasNodeModules: boolean;
  };
  warnings: string[];
  error?: string;
}

async function detectLayout(rawPath: string): Promise<CheckResult> {
  const targetPath = expandHome(rawPath.trim());
  if (!targetPath) {
    return emptyResult("Chemin vide.");
  }
  if (!path.isAbsolute(targetPath)) {
    return emptyResult("Le chemin doit être absolu (commence par / ou ~/).");
  }
  if (!(await pathExists(targetPath))) {
    return emptyResult(`Le dossier n'existe pas : ${targetPath}`);
  }
  const stat = await fs.stat(targetPath);
  if (!stat.isDirectory()) {
    return emptyResult("Ce n'est pas un dossier.");
  }

  let layout: "nested" | "flat" | "none" = "none";
  let careerOpsPath = "";
  let resolvedWorkspacePath = "";
  let careerOpsRelPath = "";

  if (await isCareerOpsClone(targetPath)) {
    layout = "flat";
    careerOpsPath = targetPath;
    resolvedWorkspacePath = path.dirname(targetPath);
    careerOpsRelPath = path.basename(targetPath);
  } else {
    const nested = await detectCareerOpsRelPath(targetPath);
    if (nested === "career-ops") {
      layout = "nested";
      careerOpsPath = path.join(targetPath, "career-ops");
      resolvedWorkspacePath = targetPath;
      careerOpsRelPath = "career-ops";
    }
  }

  if (layout === "none") {
    return emptyResult(
      "Ce dossier ne ressemble pas à un clone career-ops. On attend un dossier contenant `modes/` et `package.json`, soit directement, soit dans un sous-dossier `career-ops/`."
    );
  }

  const [hasModes, hasPackageJson, hasCv, hasProfile, hasPortals, hasNodeModules] = await Promise.all([
    pathExists(path.join(careerOpsPath, "modes")),
    pathExists(path.join(careerOpsPath, "package.json")),
    pathExists(path.join(careerOpsPath, "cv.md")),
    pathExists(path.join(careerOpsPath, "config", "profile.yml")),
    pathExists(path.join(careerOpsPath, "portals.yml")),
    pathExists(path.join(careerOpsPath, "node_modules")),
  ]);

  const warnings: string[] = [];
  if (!hasCv) warnings.push("cv.md absent");
  if (!hasProfile) warnings.push("config/profile.yml absent");
  if (!hasPortals) warnings.push("portals.yml absent");
  if (!hasNodeModules) warnings.push("node_modules absent (lance `npm install` dans ce dossier)");

  return {
    ok: true,
    layout,
    resolvedWorkspacePath,
    careerOpsRelPath,
    details: { hasModes, hasPackageJson, hasCv, hasProfile, hasPortals, hasNodeModules },
    warnings,
  };
}

function emptyResult(error: string): CheckResult {
  return {
    ok: false,
    layout: "none",
    resolvedWorkspacePath: null,
    careerOpsRelPath: null,
    details: {
      hasModes: false,
      hasPackageJson: false,
      hasCv: false,
      hasProfile: false,
      hasPortals: false,
      hasNodeModules: false,
    },
    warnings: [],
    error,
  };
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const rawPath = url.searchParams.get("path") ?? "";
  const result = await detectLayout(rawPath);
  return NextResponse.json(result);
}

interface ImportBody {
  name: string;
  path: string;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as ImportBody;
  if (!body.name || !body.path) {
    return NextResponse.json(
      { error: "Le nom et le chemin sont requis." },
      { status: 400 }
    );
  }

  const detection = await detectLayout(body.path);
  if (!detection.ok || !detection.resolvedWorkspacePath || !detection.careerOpsRelPath) {
    return NextResponse.json({ error: detection.error ?? "Dossier invalide." }, { status: 400 });
  }

  const config = await readAppConfig();
  const careerOpsAbs = path.join(detection.resolvedWorkspacePath, detection.careerOpsRelPath);
  const duplicate = config.workspaces.find(
    (w) => path.join(w.path, w.careerOpsRelPath ?? "career-ops") === careerOpsAbs
  );
  if (duplicate) {
    return NextResponse.json(
      { error: `Ce dossier est déjà importé sous le profil "${duplicate.name}".` },
      { status: 409 }
    );
  }

  const check = await checkWorkspace(detection.resolvedWorkspacePath, detection.careerOpsRelPath);

  const workspace: Workspace = {
    id: generateWorkspaceId(),
    name: body.name.trim(),
    path: detection.resolvedWorkspacePath,
    careerOpsRelPath: detection.careerOpsRelPath,
    imported: true,
    createdAt: new Date().toISOString(),
    lastUsedAt: new Date().toISOString(),
    health: check.health,
    healthDetails: check.details,
  };

  const next = await updateAppConfig((current) => ({
    ...current,
    workspaces: [...current.workspaces, workspace],
    activeWorkspaceId: current.activeWorkspaceId ?? workspace.id,
  }));

  return NextResponse.json({ workspace, config: next, warnings: detection.warnings });
}
