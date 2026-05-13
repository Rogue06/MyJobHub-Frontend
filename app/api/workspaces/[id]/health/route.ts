import { NextRequest, NextResponse } from "next/server";
import { readAppConfig, updateAppConfig } from "@/lib/app-config";
import { checkWorkspace } from "@/lib/workspace";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const config = await readAppConfig();
  const ws = config.workspaces.find((w) => w.id === params.id);
  if (!ws) {
    return NextResponse.json({ error: "Profil introuvable." }, { status: 404 });
  }

  const check = await checkWorkspace(ws.path, ws.careerOpsRelPath);

  const next = await updateAppConfig((current) => ({
    ...current,
    workspaces: current.workspaces.map((w) =>
      w.id === params.id ? { ...w, health: check.health, healthDetails: check.details } : w
    ),
  }));

  return NextResponse.json({ check, config: next });
}
