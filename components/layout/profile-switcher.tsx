"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Plus, CircleDot, AlertTriangle, CircleX, HelpCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { WorkspaceHealth } from "@/types/workspace";
import { cn } from "@/lib/utils";

function HealthDot({ health }: { health: WorkspaceHealth }) {
  const map: Record<WorkspaceHealth, { color: string; label: string; Icon: React.ElementType }> = {
    ok: { color: "text-emerald-500", label: "Profil sain", Icon: CircleDot },
    warning: { color: "text-amber-500", label: "Avertissement", Icon: AlertTriangle },
    error: { color: "text-red-500", label: "Erreur", Icon: CircleX },
    unknown: { color: "text-muted-foreground", label: "Non vérifié", Icon: HelpCircle },
    checking: { color: "text-muted-foreground animate-pulse", label: "Vérification…", Icon: CircleDot },
  };
  const { color, label, Icon } = map[health];
  return <Icon className={cn("h-3.5 w-3.5", color)} aria-label={label} />;
}

export function ProfileSwitcher() {
  const { config, activeWorkspace, setActiveWorkspace } = useWorkspace();
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" className="w-[260px] justify-between font-normal" />}>
        <span className="flex items-center gap-2 truncate">
          {activeWorkspace ? (
            <>
              <HealthDot health={activeWorkspace.health} />
              <span className="truncate">{activeWorkspace.name}</span>
            </>
          ) : (
            <span className="text-muted-foreground">Aucun profil actif</span>
          )}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[260px]" align="start">
        <DropdownMenuLabel>Mes profils</DropdownMenuLabel>
        {config.workspaces.length === 0 ? (
          <DropdownMenuItem disabled className="text-muted-foreground">
            Aucun profil pour le moment
          </DropdownMenuItem>
        ) : (
          config.workspaces.map((w) => (
            <DropdownMenuItem
              key={w.id}
              onClick={() => setActiveWorkspace(w.id)}
              className="cursor-pointer"
            >
              <HealthDot health={w.health} />
              <span className="ml-2 flex-1 truncate">{w.name}</span>
              {w.id === config.activeWorkspaceId && <Check className="ml-2 h-4 w-4" />}
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => router.push("/profils/nouveau")}
          className="cursor-pointer"
        >
          <Plus className="mr-2 h-4 w-4" /> Créer un nouveau profil
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => router.push("/profils")}
          className="cursor-pointer text-muted-foreground"
        >
          Gérer les profils
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
