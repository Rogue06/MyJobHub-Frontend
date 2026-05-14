import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { Workspace } from "@/types/workspace";
import { getCareerOpsPath } from "@/lib/workspace";
import { readApplications, computeStats } from "@/lib/tracker";
import { readPipeline, readFeedback } from "@/lib/triage";

export interface DashboardStats {
  candidatureCount: number;
  averageScore: number | null;
  pipelinePending: number;
  rejections: number;
  documentsCount: number;
  reportsCount: number;
  lastScanAt: string | null;
  staleFollowups: number;
  byStatus: Record<string, number>;
}

export interface DashboardRecommendation {
  id: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  priority: "high" | "medium" | "low";
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function countFilesInDir(dirPath: string): Promise<number> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    let count = 0;
    for (const entry of entries) {
      if (entry.isDirectory()) {
        count += await countFilesInDir(path.join(dirPath, entry.name));
      } else if (!entry.name.startsWith(".")) {
        count++;
      }
    }
    return count;
  } catch {
    return 0;
  }
}

async function getLastScanAt(careerOpsPath: string): Promise<string | null> {
  const scanFile = path.join(careerOpsPath, "data", "scan-history.tsv");
  if (!(await pathExists(scanFile))) return null;
  try {
    const stat = await fs.stat(scanFile);
    return stat.mtime.toISOString();
  } catch {
    return null;
  }
}

export async function buildDashboardStats(workspace: Workspace): Promise<DashboardStats> {
  const careerOpsPath = getCareerOpsPath(workspace);

  const [tracker, pipeline, feedback, outputCount, reportsCount, lastScanAt] = await Promise.all([
    readApplications(workspace).catch(() => null),
    readPipeline(workspace).catch(() => []),
    readFeedback(workspace).catch(() => ({ rejections: [], approvals: [] })),
    countFilesInDir(path.join(careerOpsPath, "output")),
    countFilesInDir(path.join(careerOpsPath, "reports")),
    getLastScanAt(careerOpsPath),
  ]);

  const trackerStats = tracker ? computeStats(tracker.applications) : null;
  const pipelinePending = pipeline.filter((p) => p.status === "pending").length;
  const rejections = feedback.rejections.length;

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const staleFollowups = tracker
    ? tracker.applications.filter((a) => {
        if (!["Applied", "Responded"].includes(a.status)) return false;
        const t = Date.parse(a.date);
        return !isNaN(t) && t < sevenDaysAgo;
      }).length
    : 0;

  return {
    candidatureCount: trackerStats?.total ?? 0,
    averageScore: trackerStats?.averageScore ?? null,
    pipelinePending,
    rejections,
    documentsCount: outputCount,
    reportsCount,
    lastScanAt,
    staleFollowups,
    byStatus: trackerStats?.byStatus ?? {},
  };
}

export function buildRecommendations(stats: DashboardStats): DashboardRecommendation[] {
  const recos: DashboardRecommendation[] = [];

  if (stats.pipelinePending > 0) {
    recos.push({
      id: "pipeline",
      title: `${stats.pipelinePending} offre${stats.pipelinePending > 1 ? "s" : ""} en attente d'évaluation`,
      description:
        "Tu as des URLs dans ton inbox qui attendent d'être analysées. Le pipeline va toutes les évaluer en parallèle.",
      ctaLabel: "Traiter l'inbox",
      ctaHref: "/triage",
      priority: "high",
    });
  }

  if (stats.staleFollowups >= 3) {
    recos.push({
      id: "followups",
      title: `${stats.staleFollowups} candidatures à relancer`,
      description: "Plusieurs envois datent de plus d'une semaine sans réponse. Un petit message peut tout changer.",
      ctaLabel: "Voir mes candidatures",
      ctaHref: "/candidatures",
      priority: "high",
    });
  } else if (stats.staleFollowups > 0) {
    recos.push({
      id: "followups-soft",
      title: `${stats.staleFollowups} relance${stats.staleFollowups > 1 ? "s" : ""} à envisager`,
      description: "Quelques candidatures gagneraient à recevoir un follow-up.",
      ctaLabel: "Voir mes candidatures",
      ctaHref: "/candidatures",
      priority: "medium",
    });
  }

  if (!stats.lastScanAt) {
    recos.push({
      id: "first-scan",
      title: "Tu n'as pas encore lancé de scan",
      description: "Le scan parcourt automatiquement les sites configurés. Le scan rapide ne consomme pas Claude.",
      ctaLabel: "Lancer un scan",
      ctaHref: "/triage",
      priority: stats.pipelinePending === 0 ? "high" : "medium",
    });
  } else {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    if (Date.parse(stats.lastScanAt) < oneDayAgo && stats.pipelinePending < 3) {
      recos.push({
        id: "rescan",
        title: "Dernier scan il y a plus de 24 h",
        description: "Les recruteurs publient surtout en début de semaine. Un scan matinal te garde à jour.",
        ctaLabel: "Rescanner",
        ctaHref: "/triage",
        priority: "medium",
      });
    }
  }

  if (stats.candidatureCount > 0 && stats.candidatureCount % 10 === 0) {
    recos.push({
      id: "patterns",
      title: `${stats.candidatureCount} candidatures envoyées, on regarde les patterns ?`,
      description: "Avec ce volume, l'analyse de patterns révèle ce qui marche et ce qui te fait perdre du temps.",
      ctaLabel: "Analyser mes patterns",
      ctaHref: "/actions",
      priority: "low",
    });
  }

  if (stats.rejections >= 5) {
    recos.push({
      id: "refine",
      title: `${stats.rejections} rejets enregistrés — affiner les filtres ?`,
      description: "Avec assez de feedback, Claude peut proposer de nouvelles règles pour ton portals.yml.",
      ctaLabel: "Affiner les filtres",
      ctaHref: "/triage",
      priority: "medium",
    });
  }

  recos.sort((a, b) => {
    const score = (p: DashboardRecommendation["priority"]) => (p === "high" ? 3 : p === "medium" ? 2 : 1);
    return score(b.priority) - score(a.priority);
  });

  return recos.slice(0, 3);
}
