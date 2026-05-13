"use client";

import * as React from "react";
import { ProfileSwitcher } from "@/components/layout/profile-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";

interface HeaderProps {
  title?: string;
  description?: string;
}

export function Header({ title, description }: HeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between gap-4 border-b bg-background/95 px-6 backdrop-blur">
      <div className="flex flex-col">
        {title ? (
          <h1 className="text-base font-semibold leading-tight">{title}</h1>
        ) : null}
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-3">
        <ProfileSwitcher />
        <ThemeToggle />
      </div>
    </header>
  );
}
