import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import { readAppConfig, updateAppConfig } from "@/lib/app-config";
import { checkWorkspace } from "@/lib/workspace";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const config = await readAppConfig();
  const ws = config.workspaces.find((w) => w.id === params.id);
  if (!ws) {
    return NextResponse.json({ error: "Profil introuvable." }, { status: 404 });
  }
  const check = await checkWorkspace(ws.path, ws.careerOpsRelPath);
  return NextResponse.json({ workspace: { ...ws, health: check.health, healthDetails: check.details }, check });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const url = new URL(req.url);
  const removeFiles = url.searchParams.get("removeFiles") === "true";

  const config = await readAppConfig();
  const ws = config.workspaces.find((w) => w.id === params.id);
  if (!ws) {
    return NextResponse.json({ error: "Profil introuvable." }, { status: 404 });
  }

  if (removeFiles) {
    try {
      await fs.rm(ws.path, { recursive: true, force: true });
    } catch (err) {
      return NextResponse.json(
        {
          error: "Impossible de supprimer les fichiers du profil.",
          details: String(err),
        },
        { status: 500 }
      );
    }
  }

  const next = await updateAppConfig((current) => ({
    ...current,
    workspaces: current.workspaces.filter((w) => w.id !== params.id),
    activeWorkspaceId: current.activeWorkspaceId === params.id ? null : current.activeWorkspaceId,
  }));

  return NextResponse.json({ config: next, removedFiles: removeFiles });
}
