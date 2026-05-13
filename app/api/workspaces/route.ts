import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { readAppConfig, updateAppConfig } from "@/lib/app-config";
import { generateWorkspaceId, slugify } from "@/lib/workspace";
import { expandHome } from "@/lib/paths";
import { Workspace } from "@/types/workspace";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = await readAppConfig();
  return NextResponse.json({ workspaces: config.workspaces });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { name?: string; parentDir?: string };
    if (!body.name || !body.parentDir) {
      return NextResponse.json(
        { error: "Le nom du profil et le dossier parent sont requis." },
        { status: 400 }
      );
    }

    const name = body.name.trim();
    const parentDir = expandHome(body.parentDir.trim());
    if (!name) {
      return NextResponse.json({ error: "Le nom du profil ne peut pas être vide." }, { status: 400 });
    }

    const slug = slugify(name) || `profil-${Date.now()}`;
    const workspacePath = path.join(parentDir, slug);

    try {
      await fs.access(workspacePath);
      return NextResponse.json(
        {
          error: `Un dossier existe déjà à cet emplacement : ${workspacePath}. Choisis un autre nom ou supprime le dossier existant.`,
        },
        { status: 409 }
      );
    } catch {
      // path does not exist - we want this
    }

    await fs.mkdir(workspacePath, { recursive: true });

    const workspace: Workspace = {
      id: generateWorkspaceId(),
      name,
      path: workspacePath,
      createdAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
      health: "unknown",
    };

    const next = await updateAppConfig((current) => ({
      ...current,
      workspaces: [...current.workspaces, workspace],
    }));

    return NextResponse.json({ workspace, config: next });
  } catch (err) {
    return NextResponse.json(
      { error: "Impossible de créer le profil.", details: String(err) },
      { status: 500 }
    );
  }
}
