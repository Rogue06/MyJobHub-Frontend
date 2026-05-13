import { NextRequest, NextResponse } from "next/server";
import { generateProfileFromPdf } from "@/lib/generate-profile";
import { isClaudeAvailable } from "@/lib/claude-runner";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { pdfText?: string };
    if (!body.pdfText || body.pdfText.trim().length < 30) {
      return NextResponse.json(
        { error: "Le texte du CV est trop court pour être structuré." },
        { status: 400 }
      );
    }

    const available = await isClaudeAvailable();
    if (!available) {
      return NextResponse.json(
        {
          error:
            "Claude Code CLI n'est pas accessible. Vérifie qu'il est installé (commande `claude`) et que tu y es connecté.",
        },
        { status: 503 }
      );
    }

    const result = await generateProfileFromPdf(body.pdfText);
    return NextResponse.json({
      cvMarkdown: result.cvMarkdown,
      profileYaml: result.profileYaml,
      profile: result.profile,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Erreur inconnue lors de la génération.",
      },
      { status: 500 }
    );
  }
}
