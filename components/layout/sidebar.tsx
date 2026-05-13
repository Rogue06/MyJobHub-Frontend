"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Send,
  Filter,
  ListChecks,
  FileText,
  Settings,
  Users,
  Compass,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/components/providers/workspace-provider";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  description: string;
  requiresWorkspace?: boolean;
}

const PRIMARY: NavItem[] = [
  { label: "Tableau de bord", href: "/", icon: Home, description: "Vue d'ensemble" },
  {
    label: "Évaluer une offre",
    href: "/evaluer",
    icon: Send,
    description: "Coller une URL ou un texte",
    requiresWorkspace: true,
  },
  {
    label: "Triage des annonces",
    href: "/triage",
    icon: Filter,
    description: "Affiner les filtres",
    requiresWorkspace: true,
  },
  {
    label: "Candidatures",
    href: "/candidatures",
    icon: ListChecks,
    description: "Suivi de mes candidatures",
    requiresWorkspace: true,
  },
  {
    label: "Documents",
    href: "/documents",
    icon: FileText,
    description: "CV et lettres générés",
    requiresWorkspace: true,
  },
];

const SECONDARY: NavItem[] = [
  {
    label: "Configuration",
    href: "/profil",
    icon: Settings,
    description: "Éditer le profil actif",
    requiresWorkspace: true,
  },
  { label: "Profils", href: "/profils", icon: Users, description: "Gérer mes profils" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { activeWorkspace } = useWorkspace();

  const renderItem = (item: NavItem) => {
    const isActive =
      item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`);
    const isDisabled = item.requiresWorkspace && !activeWorkspace;

    const inner = (
      <span
        className={cn(
          "flex items-start gap-3 rounded-md px-3 py-2 text-sm transition-colors",
          isActive
            ? "bg-accent text-accent-foreground"
            : "text-foreground hover:bg-accent/50",
          isDisabled && "pointer-events-none opacity-50"
        )}
      >
        <item.icon className="mt-0.5 h-4 w-4 shrink-0" />
        <span className="flex flex-col">
          <span className="font-medium leading-tight">{item.label}</span>
          <span className="text-xs text-muted-foreground">{item.description}</span>
        </span>
      </span>
    );

    return isDisabled ? (
      <div key={item.href} title="Sélectionne un profil pour activer cette section">
        {inner}
      </div>
    ) : (
      <Link key={item.href} href={item.href}>
        {inner}
      </Link>
    );
  };

  return (
    <aside className="hidden w-[260px] shrink-0 flex-col border-r bg-sidebar md:flex">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <Compass className="h-5 w-5 text-primary" />
        <span className="text-base font-semibold tracking-tight">MyJobHub</span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        <div className="space-y-1">{PRIMARY.map(renderItem)}</div>
        <div className="px-3 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Paramètres
        </div>
        <div className="space-y-1">{SECONDARY.map(renderItem)}</div>
      </nav>
      <div className="border-t p-3 text-xs text-muted-foreground">
        Interface graphique pour{" "}
        <a
          href="https://github.com/santifer/career-ops"
          target="_blank"
          rel="noopener noreferrer"
          className="underline-offset-2 hover:underline"
        >
          career-ops
        </a>
      </div>
    </aside>
  );
}
