import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";
import { readAppConfig } from "@/lib/app-config";
import { getCareerOpsPath } from "@/lib/workspace";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface OpenPayload {
  relativePath: string;
  reveal?: boolean;
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const config = await readAppConfig();
  const ws = config.workspaces.find((w) => w.id === params.id);
  if (!ws) return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });

  const body = (await req.json()) as OpenPayload;
  if (!body.relativePath) {
    return NextResponse.json({ error: "Chemin manquant." }, { status: 400 });
  }

  const careerOpsPath = getCareerOpsPath(ws);
  const target = path.resolve(careerOpsPath, body.relativePath);
  if (!target.startsWith(careerOpsPath + path.sep) && target !== careerOpsPath) {
    return NextResponse.json({ error: "Chemin hors du dossier du profil." }, { status: 400 });
  }

  const platform = os.platform();
  let cmd: string;
  let args: string[];

  if (platform === "darwin") {
    cmd = "open";
    args = body.reveal ? ["-R", target] : [target];
  } else if (platform === "win32") {
    cmd = "explorer.exe";
    args = body.reveal ? ["/select,", target] : [target];
  } else {
    cmd = "xdg-open";
    args = [body.reveal ? path.dirname(target) : target];
  }

  try {
    const child = spawn(cmd, args, { detached: true, stdio: "ignore" });
    child.unref();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Impossible d'ouvrir le fichier sur ce système.", details: String(err) },
      { status: 500 }
    );
  }
}
