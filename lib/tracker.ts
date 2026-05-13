import { promises as fs } from "node:fs";
import path from "node:path";
import { Workspace } from "@/types/workspace";
import { getCareerOpsPath } from "@/lib/workspace";

export interface Application {
  id: string;
  index: string;
  date: string;
  company: string;
  role: string;
  score: string;
  status: string;
  pdf: string;
  report: string;
}

export interface TrackerData {
  applications: Application[];
  raw: string;
  source: string;
}

const STATUS_NORMALIZE: Record<string, string> = {
  evaluada: "Evaluated",
  evaluated: "Evaluated",
  aplicado: "Applied",
  aplicada: "Applied",
  applied: "Applied",
  respondido: "Responded",
  responded: "Responded",
  contacto: "Contact",
  contact: "Contact",
  entrevista: "Interview",
  interview: "Interview",
  oferta: "Offer",
  offer: "Offer",
  rechazada: "Rejected",
  rejected: "Rejected",
  descartada: "Discarded",
  discarded: "Discarded",
  "no aplicar": "Skip",
  skip: "Skip",
};

export function normalizeStatus(input: string): string {
  const cleaned = input.replace(/\*+/g, "").trim().toLowerCase();
  return STATUS_NORMALIZE[cleaned] ?? input.trim();
}

export async function readApplications(workspace: Workspace): Promise<TrackerData> {
  const filePath = path.join(getCareerOpsPath(workspace), "data", "applications.md");
  let raw = "";
  try {
    raw = await fs.readFile(filePath, "utf-8");
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return { applications: [], raw: "", source: filePath };
    }
    throw err;
  }
  return { applications: parseApplicationsTable(raw), raw, source: filePath };
}

function parseApplicationsTable(md: string): Application[] {
  const lines = md.split("\n");
  const apps: Application[] = [];

  let headerCols: string[] | null = null;
  let inTable = false;

  for (const line of lines) {
    if (!line.includes("|")) {
      inTable = false;
      headerCols = null;
      continue;
    }
    const cells = line
      .split("|")
      .map((s) => s.trim())
      .filter((_, i, arr) => i > 0 && i < arr.length - 1 || (i === 0 && arr[0] !== "") || (i === arr.length - 1 && arr[arr.length - 1] !== ""));

    const normalized = line
      .replace(/^\s*\|/, "")
      .replace(/\|\s*$/, "")
      .split("|")
      .map((s) => s.trim());

    if (normalized.every((c) => /^[-:\s]+$/.test(c))) {
      inTable = headerCols !== null;
      continue;
    }

    if (!headerCols) {
      headerCols = normalized;
      continue;
    }

    if (!inTable) continue;

    const get = (keys: string[]): string => {
      for (const k of keys) {
        const idx = headerCols!.findIndex((h) => h.toLowerCase().includes(k));
        if (idx >= 0 && idx < normalized.length) return normalized[idx];
      }
      return "";
    };

    const indexVal = get(["#", "id"]);
    const company = get(["empresa", "company", "entreprise"]);
    if (!company && !indexVal) continue;

    apps.push({
      id: `${indexVal || apps.length + 1}-${company.slice(0, 32)}`,
      index: indexVal,
      date: get(["fecha", "date"]),
      company,
      role: get(["rol", "role", "poste"]),
      score: get(["score", "note"]),
      status: normalizeStatus(get(["estado", "status", "statut"])),
      pdf: get(["pdf"]),
      report: get(["report", "rapport", "informe"]),
    });
  }

  return apps;
}

export function computeStats(apps: Application[]) {
  const total = apps.length;
  const byStatus: Record<string, number> = {};
  let scoreSum = 0;
  let scoreCount = 0;
  let withPdf = 0;
  let withReport = 0;
  for (const a of apps) {
    byStatus[a.status] = (byStatus[a.status] ?? 0) + 1;
    const num = parseScoreToNumber(a.score);
    if (num !== null) {
      scoreSum += num;
      scoreCount++;
    }
    if (a.pdf && a.pdf !== "-" && a.pdf.length > 0) withPdf++;
    if (a.report && a.report !== "-" && a.report.length > 0) withReport++;
  }
  return {
    total,
    byStatus,
    averageScore: scoreCount > 0 ? scoreSum / scoreCount : null,
    withPdfPct: total > 0 ? (withPdf / total) * 100 : 0,
    withReportPct: total > 0 ? (withReport / total) * 100 : 0,
  };
}

function parseScoreToNumber(score: string): number | null {
  const cleaned = score.trim().replace(/,/g, ".");
  const num = parseFloat(cleaned);
  if (isFinite(num)) return num;
  const letter = cleaned.toUpperCase()[0];
  const map: Record<string, number> = { A: 5, B: 4, C: 3, D: 2, E: 1, F: 0 };
  return map[letter] ?? null;
}
