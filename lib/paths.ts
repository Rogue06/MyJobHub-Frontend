import os from "node:os";
import path from "node:path";

export function expandHome(input: string): string {
  if (!input) return input;
  if (input.startsWith("~/")) {
    return path.join(os.homedir(), input.slice(2));
  }
  if (input === "~") {
    return os.homedir();
  }
  return input;
}

export function defaultWorkspacesParent(): string {
  return path.join(os.homedir(), "Documents", "MyJobHub");
}
