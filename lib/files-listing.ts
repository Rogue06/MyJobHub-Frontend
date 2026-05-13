import { promises as fs } from "node:fs";
import path from "node:path";
import { Workspace } from "@/types/workspace";
import { getCareerOpsPath } from "@/lib/workspace";

export interface DocumentFile {
  name: string;
  relativePath: string;
  absolutePath: string;
  category: "cv" | "lettre" | "rapport" | "autre";
  parent: string;
  sizeBytes: number;
  modifiedAt: string;
}

export async function listGeneratedDocuments(workspace: Workspace): Promise<DocumentFile[]> {
  const careerOpsPath = getCareerOpsPath(workspace);
  const outputDir = path.join(careerOpsPath, "output");
  const reportsDir = path.join(careerOpsPath, "reports");

  const docs: DocumentFile[] = [];
  await walkDir(outputDir, careerOpsPath, docs);
  await walkDir(reportsDir, careerOpsPath, docs);

  docs.sort((a, b) => (b.modifiedAt > a.modifiedAt ? 1 : -1));
  return docs;
}

async function walkDir(dir: string, rootDir: string, out: DocumentFile[]): Promise<void> {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkDir(abs, rootDir, out);
    } else if (entry.isFile()) {
      if (entry.name.startsWith(".")) continue;
      const stat = await fs.stat(abs);
      const rel = path.relative(rootDir, abs);
      out.push({
        name: entry.name,
        relativePath: rel,
        absolutePath: abs,
        category: classify(entry.name),
        parent: path.relative(rootDir, dir),
        sizeBytes: stat.size,
        modifiedAt: stat.mtime.toISOString(),
      });
    }
  }
}

function classify(name: string): DocumentFile["category"] {
  const lower = name.toLowerCase();
  if (lower.includes("cv") || lower.includes("resume") || lower.includes("cover-cv")) return "cv";
  if (lower.includes("letter") || lower.includes("lettre") || lower.includes("motiv")) return "lettre";
  if (lower.endsWith(".md") || lower.includes("report") || lower.includes("rapport") || lower.includes("evaluation")) return "rapport";
  return "autre";
}
