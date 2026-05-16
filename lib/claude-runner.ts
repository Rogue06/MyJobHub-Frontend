import "server-only";
import { runCommand, CliEvent } from "@/lib/cli";
import { ClaudeModelChoice } from "@/lib/claude-models";

export type { ClaudeModelChoice } from "@/lib/claude-models";
export { CLAUDE_MODEL_OPTIONS } from "@/lib/claude-models";

export interface ClaudeRunOptions {
  cwd?: string;
  prompt: string;
  model?: ClaudeModelChoice;
  /** Auto-approuve les écritures de fichiers et les exécutions de Bash dans le workspace.
   *  Défaut : true (sinon Claude bloque en attente de confirmation interactive en mode -p). */
  autoApprove?: boolean;
  onEvent?: (event: CliEvent) => void;
  timeout?: number;
}

function buildArgs(prompt: string, model?: ClaudeModelChoice, autoApprove = true): string[] {
  const args = ["-p", prompt];
  if (model && model !== "default") {
    args.push("--model", model);
  }
  if (autoApprove) {
    // Sans ce flag, `claude -p` (mode headless) attend une confirmation
    // interactive pour chaque Write/Edit/Bash et bloque le pipeline. On
    // est dans un workspace local appartenant à l'utilisateur — il a
    // explicitement lancé MyJobHub pour que Claude bosse sur ses fichiers.
    args.push("--dangerously-skip-permissions");
  }
  return args;
}

export async function isClaudeAvailable(): Promise<boolean> {
  try {
    const result = await runCommand("claude", ["--version"], { timeout: 5000 });
    return result.exitCode === 0;
  } catch {
    return false;
  }
}

export async function runClaude(options: ClaudeRunOptions): Promise<{
  exitCode: number;
  stdout: string;
  stderr: string;
}> {
  return runCommand("claude", buildArgs(options.prompt, options.model, options.autoApprove !== false), {
    cwd: options.cwd,
    onEvent: options.onEvent,
    timeout: options.timeout ?? 5 * 60 * 1000,
  });
}

export function buildClaudeArgs(
  prompt: string,
  model?: ClaudeModelChoice,
  options?: { autoApprove?: boolean }
): string[] {
  return buildArgs(prompt, model, options?.autoApprove !== false);
}
