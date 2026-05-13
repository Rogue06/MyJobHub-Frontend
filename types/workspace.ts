export type WorkspaceHealth = "ok" | "warning" | "error" | "unknown" | "checking";

export interface Workspace {
  id: string;
  name: string;
  path: string;
  /**
   * Relative path of the career-ops clone inside the workspace.
   * Defaults to "career-ops" (nested layout produced by the wizard).
   * Use "." or another folder name when importing an existing folder
   * whose layout doesn't match the wizard convention.
   */
  careerOpsRelPath?: string;
  imported?: boolean;
  createdAt: string;
  lastUsedAt: string;
  health: WorkspaceHealth;
  healthDetails?: string;
}

export interface AppConfig {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  masterCvPath: string | null;
  theme: "light" | "dark" | "system";
  configVersion: number;
}

export const APP_CONFIG_VERSION = 1;

export const DEFAULT_CONFIG: AppConfig = {
  workspaces: [],
  activeWorkspaceId: null,
  masterCvPath: null,
  theme: "system",
  configVersion: APP_CONFIG_VERSION,
};
