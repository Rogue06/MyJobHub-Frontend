import { spawn, SpawnOptions } from "node:child_process";

export interface CliEvent {
  type: "stdout" | "stderr" | "exit" | "error" | "info";
  data: string;
  exitCode?: number;
}

export interface RunCommandOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  onEvent?: (event: CliEvent) => void;
  timeout?: number;
}

export async function runCommand(
  command: string,
  args: string[],
  options: RunCommandOptions = {}
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: { ...process.env, ...options.env },
      stdio: ["ignore", "pipe", "pipe"],
    } as SpawnOptions);

    let stdout = "";
    let stderr = "";
    let timer: NodeJS.Timeout | undefined;

    if (options.timeout) {
      timer = setTimeout(() => {
        child.kill("SIGTERM");
        options.onEvent?.({ type: "error", data: `Commande tuée après ${options.timeout}ms` });
        reject(new Error(`Commande tuée après ${options.timeout}ms`));
      }, options.timeout);
    }

    child.stdout?.on("data", (chunk) => {
      const str = chunk.toString();
      stdout += str;
      options.onEvent?.({ type: "stdout", data: str });
    });

    child.stderr?.on("data", (chunk) => {
      const str = chunk.toString();
      stderr += str;
      options.onEvent?.({ type: "stderr", data: str });
    });

    child.on("error", (err) => {
      if (timer) clearTimeout(timer);
      options.onEvent?.({ type: "error", data: err.message });
      reject(err);
    });

    child.on("close", (code) => {
      if (timer) clearTimeout(timer);
      const exitCode = code ?? 0;
      options.onEvent?.({ type: "exit", data: `Exit ${exitCode}`, exitCode });
      resolve({ exitCode, stdout, stderr });
    });
  });
}

export interface StreamEvent {
  type: "info" | "log" | "warn" | "error" | "success" | "step" | "done";
  message: string;
  meta?: Record<string, unknown>;
}

export function createSseStream(
  generate: (emit: (event: StreamEvent) => void) => Promise<void>
): Response {
  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: StreamEvent) => {
        if (closed) return;
        const payload = `data: ${JSON.stringify(event)}\n\n`;
        try {
          controller.enqueue(encoder.encode(payload));
        } catch {
          closed = true;
        }
      };
      try {
        await generate(emit);
      } catch (err) {
        emit({
          type: "error",
          message: err instanceof Error ? err.message : "Erreur inconnue",
        });
      } finally {
        if (!closed) {
          try {
            controller.close();
          } catch {}
        }
      }
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
