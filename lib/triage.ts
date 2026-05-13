import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import yaml from "yaml";
import { Workspace } from "@/types/workspace";
import { getCareerOpsPath } from "@/lib/workspace";
import { MyJobHubFeedback, FeedbackEntry, PipelineEntry, RejectionReason } from "@/lib/triage-types";

export type { MyJobHubFeedback, FeedbackEntry, PipelineEntry, RejectionReason };
export { REJECTION_REASONS } from "@/lib/triage-types";

const FEEDBACK_FILENAME = "myjobhub-feedback.yml";

function pipelinePath(ws: Workspace) {
  return path.join(getCareerOpsPath(ws), "data", "pipeline.md");
}

function feedbackPath(ws: Workspace) {
  return path.join(getCareerOpsPath(ws), "data", FEEDBACK_FILENAME);
}

export async function readPipeline(ws: Workspace): Promise<PipelineEntry[]> {
  let raw: string;
  try {
    raw = await fs.readFile(pipelinePath(ws), "utf-8");
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
  return parsePipeline(raw);
}

function parsePipeline(raw: string): PipelineEntry[] {
  const lines = raw.split("\n");
  const entries: PipelineEntry[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    let match: RegExpMatchArray | null = null;

    if ((match = trimmed.match(/^-\s*\[\s*\]\s*(.+)$/))) {
      const parts = match[1].split("|").map((s) => s.trim());
      entries.push({
        status: "pending",
        url: extractUrl(parts[0]) ?? parts[0],
        raw: trimmed,
        company: parts[1],
        role: parts[2],
      });
    } else if ((match = trimmed.match(/^-\s*\[x\]\s*(.+)$/i))) {
      const parts = match[1].split("|").map((s) => s.trim());
      entries.push({
        status: "processed",
        url: extractUrl(parts[1] ?? parts[0]) ?? parts[0],
        raw: trimmed,
        company: parts[2],
        role: parts[3],
        score: parts[4],
      });
    } else if ((match = trimmed.match(/^-\s*\[!\]\s*(.+)$/))) {
      entries.push({
        status: "error",
        url: extractUrl(match[1]) ?? match[1],
        raw: trimmed,
        note: match[1],
      });
    }
  }
  return entries;
}

function extractUrl(s?: string): string | null {
  if (!s) return null;
  const m = s.match(/https?:\/\/\S+/);
  return m ? m[0] : null;
}

export async function appendPendingUrl(ws: Workspace, url: string): Promise<void> {
  const filePath = pipelinePath(ws);
  let raw = "";
  try {
    raw = await fs.readFile(filePath, "utf-8");
  } catch {
    raw = "## Pendientes\n\n## Procesadas\n";
  }
  if (!/^## Pendientes/m.test(raw)) {
    raw = `## Pendientes\n\n${raw}`;
  }
  raw = raw.replace(/(## Pendientes\s*\n)/, (m) => `${m}- [ ] ${url}\n`);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, raw, "utf-8");
}

export async function readFeedback(ws: Workspace): Promise<MyJobHubFeedback> {
  try {
    const raw = await fs.readFile(feedbackPath(ws), "utf-8");
    const parsed = (yaml.parse(raw) ?? {}) as Partial<MyJobHubFeedback>;
    return {
      rejections: parsed.rejections ?? [],
      approvals: parsed.approvals ?? [],
    };
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return { rejections: [], approvals: [] };
    }
    throw err;
  }
}

export async function writeFeedback(ws: Workspace, feedback: MyJobHubFeedback): Promise<void> {
  const filePath = feedbackPath(ws);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, yaml.stringify(feedback, { lineWidth: 120 }), "utf-8");
}

export async function addRejection(
  ws: Workspace,
  entry: Omit<FeedbackEntry, "id" | "createdAt">
): Promise<FeedbackEntry> {
  const current = await readFeedback(ws);
  const full: FeedbackEntry = {
    ...entry,
    id: `rej_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
  };
  current.rejections.unshift(full);
  await writeFeedback(ws, current);
  return full;
}

export async function removeRejection(ws: Workspace, id: string): Promise<void> {
  const current = await readFeedback(ws);
  current.rejections = current.rejections.filter((r) => r.id !== id);
  await writeFeedback(ws, current);
}

export async function addApproval(
  ws: Workspace,
  approval: { url: string; title?: string }
): Promise<void> {
  const current = await readFeedback(ws);
  current.approvals.unshift({
    id: `app_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
    ...approval,
  });
  await writeFeedback(ws, current);
}
