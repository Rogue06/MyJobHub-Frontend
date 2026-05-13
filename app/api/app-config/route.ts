import { NextRequest, NextResponse } from "next/server";
import { readAppConfig, updateAppConfig } from "@/lib/app-config";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = await readAppConfig();
    return NextResponse.json(config);
  } catch (err) {
    return NextResponse.json(
      { error: "Impossible de lire la configuration de l'application.", details: String(err) },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<{
      activeWorkspaceId: string | null;
      masterCvPath: string | null;
      theme: "light" | "dark" | "system";
    }>;

    const next = await updateAppConfig((current) => ({
      ...current,
      ...(body.activeWorkspaceId !== undefined ? { activeWorkspaceId: body.activeWorkspaceId } : {}),
      ...(body.masterCvPath !== undefined ? { masterCvPath: body.masterCvPath } : {}),
      ...(body.theme !== undefined ? { theme: body.theme } : {}),
    }));

    return NextResponse.json(next);
  } catch (err) {
    return NextResponse.json(
      { error: "Impossible de mettre à jour la configuration.", details: String(err) },
      { status: 500 }
    );
  }
}
