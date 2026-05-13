import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { WorkspaceProvider } from "@/components/providers/workspace-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { readAppConfig } from "@/lib/app-config";
import { DEFAULT_CONFIG } from "@/types/workspace";

export const dynamic = "force-dynamic";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "MyJobHub — Recherche d'emploi assistée",
  description:
    "Interface graphique en français pour piloter career-ops : évaluation d'offres, génération de CV/LM, suivi des candidatures.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let config = DEFAULT_CONFIG;
  try {
    config = await readAppConfig();
  } catch {
    // Fall back to defaults; the API can read the live config on demand.
  }

  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={cn(inter.variable, "min-h-screen bg-background font-sans antialiased")}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <WorkspaceProvider initialConfig={config}>
            <div className="flex min-h-screen">
              <Sidebar />
              <div className="flex min-h-screen flex-1 flex-col">{children}</div>
            </div>
            <Toaster richColors closeButton position="bottom-right" />
          </WorkspaceProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
