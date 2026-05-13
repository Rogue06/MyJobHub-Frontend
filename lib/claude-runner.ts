import { runCommand, CliEvent } from "@/lib/cli";

export interface ClaudeRunOptions {
  cwd?: string;
  prompt: string;
  onEvent?: (event: CliEvent) => void;
  timeout?: number;
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
  return runCommand(
    "claude",
    ["-p", options.prompt],
    {
      cwd: options.cwd,
      onEvent: options.onEvent,
      timeout: options.timeout ?? 5 * 60 * 1000,
    }
  );
}
