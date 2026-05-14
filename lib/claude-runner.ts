import "server-only";
import { runCommand, CliEvent } from "@/lib/cli";
import { ClaudeModelChoice } from "@/lib/claude-models";

export type { ClaudeModelChoice } from "@/lib/claude-models";
export { CLAUDE_MODEL_OPTIONS } from "@/lib/claude-models";

export interface ClaudeRunOptions {
  cwd?: string;
  prompt: string;
  model?: ClaudeModelChoice;
  onEvent?: (event: CliEvent) => void;
  timeout?: number;
}

function buildArgs(prompt: string, model?: ClaudeModelChoice): string[] {
  const args = ["-p", prompt];
  if (model && model !== "default") {
    args.push("--model", model);
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
  return runCommand("claude", buildArgs(options.prompt, options.model), {
    cwd: options.cwd,
    onEvent: options.onEvent,
    timeout: options.timeout ?? 5 * 60 * 1000,
  });
}

export function buildClaudeArgs(prompt: string, model?: ClaudeModelChoice): string[] {
  return buildArgs(prompt, model);
}
