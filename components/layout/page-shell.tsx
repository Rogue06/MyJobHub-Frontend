import * as React from "react";
import { Header } from "@/components/layout/header";

interface PageShellProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function PageShell({ title, description, actions, children }: PageShellProps) {
  return (
    <>
      <Header title={title} description={description} />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-6xl px-6 py-8">
          {actions ? <div className="mb-6 flex justify-end gap-2">{actions}</div> : null}
          {children}
        </div>
      </main>
    </>
  );
}
