import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

interface CareerOpsMatch {
  path: string;
  parent: string;
  name: string;
  layout: "flat";
  hasCv: boolean;
  hasProfile: boolean;
  hasPortals: boolean;
  hasNodeModules: boolean;
}

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  ".cache",
  ".npm",
  "Library",
  "Applications",
  ".Trash",
  "Pictures",
  "Music",
  "Movies",
  ".vscode",
  ".idea",
]);

const DEFAULT_ROOTS = ["Desktop", "Documents", "Downloads"];

async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function inspectCareerOps(dirPath: string): Promise<CareerOpsMatch | null> {
  const [hasModes, hasPackage] = await Promise.all([
    pathExists(path.join(dirPath, "modes")),
    pathExists(path.join(dirPath, "package.json")),
  ]);
  if (!hasModes || !hasPackage) return null;

  const [hasCv, hasProfile, hasPortals, hasNodeModules] = await Promise.all([
    pathExists(path.join(dirPath, "cv.md")),
    pathExists(path.join(dirPath, "config", "profile.yml")),
    pathExists(path.join(dirPath, "portals.yml")),
    pathExists(path.join(dirPath, "node_modules")),
  ]);

  return {
    path: dirPath,
    parent: path.dirname(dirPath),
    name: path.basename(dirPath),
    layout: "flat",
    hasCv,
    hasProfile,
    hasPortals,
    hasNodeModules,
  };
}

async function scanDirectory(
  dirPath: string,
  depth: number,
  maxDepth: number,
  results: CareerOpsMatch[],
  visited: Set<string>
): Promise<void> {
  if (depth > maxDepth) return;
  if (visited.has(dirPath)) return;
  visited.add(dirPath);
  if (results.length >= 25) return;

  const match = await inspectCareerOps(dirPath);
  if (match) {
    results.push(match);
    return;
  }

  let entries: import("node:fs").Dirent[];
  try {
    entries = await fs.readdir(dirPath, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (results.length >= 25) break;
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith(".")) continue;
    if (SKIP_DIRS.has(entry.name)) continue;
    const child = path.join(dirPath, entry.name);
    await scanDirectory(child, depth + 1, maxDepth, results, visited);
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const customRoots = url.searchParams.get("roots");
  const maxDepth = Math.min(Number(url.searchParams.get("maxDepth") ?? "3"), 5);

  const home = os.homedir();
  const rootNames = customRoots ? customRoots.split(",") : DEFAULT_ROOTS;
  const rootPaths = rootNames.map((r) => (path.isAbsolute(r) ? r : path.join(home, r)));

  const results: CareerOpsMatch[] = [];
  const visited = new Set<string>();
  for (const r of rootPaths) {
    if (await pathExists(r)) {
      await scanDirectory(r, 0, maxDepth, results, visited);
    }
  }

  results.sort((a, b) => {
    const score = (m: CareerOpsMatch) => (m.hasCv ? 1 : 0) + (m.hasProfile ? 1 : 0) + (m.hasPortals ? 1 : 0);
    return score(b) - score(a) || a.path.localeCompare(b.path);
  });

  return NextResponse.json({ matches: results, roots: rootPaths, maxDepth });
}
