import { NextRequest, NextResponse } from "next/server";
import { readAppConfig } from "@/lib/app-config";
import { buildSearchUrls } from "@/lib/search-urls";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const config = await readAppConfig();
  const ws = config.workspaces.find((w) => w.id === params.id);
  if (!ws) return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });

  try {
    const searches = await buildSearchUrls(ws);
    return NextResponse.json({ searches });
  } catch (err) {
    return NextResponse.json(
      { error: "Construction impossible", details: String(err) },
      { status: 500 }
    );
  }
}
