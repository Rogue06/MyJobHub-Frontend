import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });
    }

    const fileName = (file as File).name ?? "cv.pdf";
    if (!fileName.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Le fichier doit être au format PDF." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length === 0) {
      return NextResponse.json({ error: "Le fichier PDF est vide." }, { status: 400 });
    }

    if (buffer.length > 15 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Le fichier PDF est trop volumineux (limite : 15 Mo)." },
        { status: 413 }
      );
    }

    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const result = await parser.getText();
    await parser.destroy();

    const text = result.text.trim();
    const pageCount = result.total;

    if (text.length < 50) {
      return NextResponse.json(
        {
          warning:
            "Le texte extrait est très court. Ton PDF contient peut-être surtout des images. Tu peux quand même continuer en saisissant manuellement.",
          fileName,
          text,
          pageCount,
          characterCount: text.length,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      fileName,
      text,
      pageCount,
      characterCount: text.length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Impossible d'extraire le texte du PDF.", details: String(err) },
      { status: 500 }
    );
  }
}
