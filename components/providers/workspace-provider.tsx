"use client";

import * as React from "react";
import { AppConfig, Workspace } from "@/types/workspace";

interface WorkspaceContextValue {
  config: AppConfig;
  activeWorkspace: Workspace | null;
  refresh: () => Promise<void>;
  setActiveWorkspace: (id: string | null) => Promise<void>;
}

const WorkspaceContext = React.createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({
  initialConfig,
  children,
}: {
  initialConfig: AppConfig;
  children: React.ReactNode;
}) {
  const [config, setConfig] = React.useState<AppConfig>(initialConfig);

  const refresh = React.useCallback(async () => {
    const res = await fetch("/api/app-config", { cache: "no-store" });
    if (res.ok) {
      const next = (await res.json()) as AppConfig;
      setConfig(next);
    }
  }, []);

  const setActiveWorkspace = React.useCallback(async (id: string | null) => {
    const res = await fetch("/api/app-config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activeWorkspaceId: id }),
    });
    if (res.ok) {
      const next = (await res.json()) as AppConfig;
      setConfig(next);
    }
  }, []);

  const activeWorkspace = React.useMemo(() => {
    if (!config.activeWorkspaceId) return null;
    return config.workspaces.find((w) => w.id === config.activeWorkspaceId) ?? null;
  }, [config]);

  return (
    <WorkspaceContext.Provider value={{ config, activeWorkspace, refresh, setActiveWorkspace }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = React.useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return ctx;
}
