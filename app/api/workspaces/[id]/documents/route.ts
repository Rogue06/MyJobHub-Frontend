import { NextRequest, NextResponse } from "next/server";
import { readAppConfig } from "@/lib/app-config";
import { listGeneratedDocuments } from "@/lib/files-listing";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const config = await readAppConfig();
  const ws = config.workspaces.find((w) => w.id === params.id);
  if (!ws) return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });

  try {
    const documents = await listGeneratedDocuments(ws);
    return NextResponse.json({ documents });
  } catch (err) {
    return NextResponse.json(
      { error: "Lecture impossible", details: String(err) },
      { status: 500 }
    );
  }
}
