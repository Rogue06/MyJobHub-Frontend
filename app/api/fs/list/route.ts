import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { expandHome } from "@/lib/paths";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface DirEntry {
  name: string;
  path: string;
  isCareerOps: boolean;
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function isCareerOps(dirPath: string): Promise<boolean> {
  const [hasModes, hasPackage] = await Promise.all([
    pathExists(path.join(dirPath, "modes")),
    pathExists(path.join(dirPath, "package.json")),
  ]);
  return hasModes && hasPackage;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const raw = url.searchParams.get("path") ?? "~";
  const home = os.homedir();
  const target = path.resolve(expandHome(raw));

  if (!target.startsWith(home) && !target.startsWith("/Volumes/")) {
    return NextResponse.json(
      { error: "Accès limité à ton dossier personnel et aux volumes externes." },
      { status: 403 }
    );
  }

  if (!(await pathExists(target))) {
    return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });
  }

  let dirents: import("node:fs").Dirent[];
  try {
    dirents = await fs.readdir(target, { withFileTypes: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }

  const entries: DirEntry[] = [];
  for (const d of dirents) {
    if (!d.isDirectory()) continue;
    if (d.name.startsWith(".")) continue;
    if (d.name === "node_modules") continue;
    const full = path.join(target, d.name);
    entries.push({
      name: d.name,
      path: full,
      isCareerOps: await isCareerOps(full),
    });
  }

  entries.sort((a, b) => {
    if (a.isCareerOps !== b.isCareerOps) return a.isCareerOps ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return NextResponse.json({
    currentPath: target,
    parentPath: target === home ? null : path.dirname(target),
    home,
    entries,
  });
}
