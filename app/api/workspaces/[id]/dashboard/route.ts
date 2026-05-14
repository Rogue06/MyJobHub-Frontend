import { NextRequest, NextResponse } from "next/server";
import { readAppConfig } from "@/lib/app-config";
import { buildDashboardStats, buildRecommendations } from "@/lib/dashboard-stats";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const config = await readAppConfig();
  const ws = config.workspaces.find((w) => w.id === params.id);
  if (!ws) return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });

  try {
    const stats = await buildDashboardStats(ws);
    const recommendations = buildRecommendations(stats);
    return NextResponse.json({ stats, recommendations });
  } catch (err) {
    return NextResponse.json(
      { error: "Calcul impossible", details: String(err) },
      { status: 500 }
    );
  }
}
