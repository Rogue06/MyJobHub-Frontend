import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { Workspace } from "@/types/workspace";
import { getCareerOpsPath } from "@/lib/workspace";

export interface ProcessedDetail {
  url: string;
  reportPath?: string;
  tldr?: string;
  salary?: string;
  location?: string;
  contract?: string;
  archetype?: string;
  score?: string;
}

/**
 * Pour chaque rapport `reports/NNN-*.md`, extrait l'URL et le résumé
 * structuré (TL;DR, salaire, lieu, contrat). Retourne un map URL → détails
 * qui permet à l'UI d'enrichir les cards "Récemment traitées".
 */
export async function readProcessedDetails(workspace: Workspace): Promise<Record<string, ProcessedDetail>> {
  const reportsDir = path.join(getCareerOpsPath(workspace), "reports");
  const map: Record<string, ProcessedDetail> = {};

  let entries: string[] = [];
  try {
    entries = await fs.readdir(reportsDir);
  } catch {
    return map;
  }

  const mdFiles = entries.filter((f) => f.endsWith(".md") && /^\d+-/.test(f));

  await Promise.all(
    mdFiles.map(async (filename) => {
      const filePath = path.join(reportsDir, filename);
      try {
        const content = await fs.readFile(filePath, "utf-8");
        const detail = parseReport(content, filePath);
        if (detail.url) map[detail.url] = detail;
      } catch {
        // ignore unreadable reports
      }
    })
  );

  return map;
}

function extract(content: string, label: string): string | undefined {
  const re = new RegExp(`\\*\\*${escapeRe(label)}\\s*:\\*\\*\\s*([^\\n]+)`, "i");
  const m = content.match(re);
  return m ? m[1].trim() : undefined;
}

function extractTldr(content: string): string | undefined {
  // Le TL;DR peut faire 1-3 lignes ; il est suivi soit d'une ligne vide,
  // soit d'un séparateur ---, soit d'une nouvelle section ##.
  const re = /\*\*TL;?DR\s*:\*\*\s*([\s\S]+?)(?:\n\n|\n---|\n##)/i;
  const m = content.match(re);
  if (!m) return undefined;
  return m[1].replace(/\n+/g, " ").replace(/\s+/g, " ").trim();
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseReport(content: string, filePath: string): ProcessedDetail {
  const url = extract(content, "URL") ?? "";
  return {
    url,
    reportPath: filePath,
    score: extract(content, "Score"),
    archetype: extract(content, "Archétype"),
    salary: extract(content, "Salaire"),
    location: extract(content, "Localisation"),
    contract: extract(content, "Contrat"),
    tldr: extractTldr(content),
  };
}
