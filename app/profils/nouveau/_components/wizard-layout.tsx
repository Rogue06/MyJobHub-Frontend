"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { WizardStepId, WIZARD_STEPS } from "../_lib/wizard-types";
import { cn } from "@/lib/utils";

interface WizardLayoutProps {
  currentStep: WizardStepId;
  children: React.ReactNode;
}

export function WizardLayout({ currentStep, children }: WizardLayoutProps) {
  const currentIndex = WIZARD_STEPS.findIndex((s) => s.id === currentStep);

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-[260px_1fr]">
      <aside className="space-y-1">
        <p className="px-3 pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Étapes
        </p>
        {WIZARD_STEPS.map((s, idx) => {
          const isActive = s.id === currentStep;
          const isDone = idx < currentIndex;
          return (
            <div
              key={s.id}
              className={cn(
                "flex items-start gap-3 rounded-md px-3 py-2 text-sm",
                isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-medium",
                  isDone
                    ? "border-primary bg-primary text-primary-foreground"
                    : isActive
                    ? "border-foreground text-foreground"
                    : "border-muted-foreground/40"
                )}
              >
                {isDone ? <Check className="h-3 w-3" /> : idx + 1}
              </span>
              <div>
                <p className={cn("font-medium leading-tight", isActive && "text-foreground")}>{s.label}</p>
                <p className="text-xs text-muted-foreground">{s.description}</p>
              </div>
            </div>
          );
        })}
      </aside>
      <div>{children}</div>
    </div>
  );
}

interface WizardStepCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function WizardStepCard({ title, description, children, footer }: WizardStepCardProps) {
  return (
    <div className="rounded-xl border bg-card">
      <div className="border-b px-6 py-5">
        <h2 className="text-lg font-semibold leading-tight">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      <div className="px-6 py-6">{children}</div>
      {footer ? <div className="flex items-center justify-between gap-3 border-t bg-muted/30 px-6 py-4">{footer}</div> : null}
    </div>
  );
}
