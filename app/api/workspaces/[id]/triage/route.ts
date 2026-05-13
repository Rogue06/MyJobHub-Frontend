import { NextRequest, NextResponse } from "next/server";
import { readAppConfig } from "@/lib/app-config";
import {
  readPipeline,
  readFeedback,
  addRejection,
  removeRejection,
  addApproval,
  appendPendingUrl,
  RejectionReason,
} from "@/lib/triage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function getWs(id: string) {
  const config = await readAppConfig();
  return config.workspaces.find((w) => w.id === id);
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const ws = await getWs(params.id);
  if (!ws) return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });

  try {
    const [pipeline, feedback] = await Promise.all([readPipeline(ws), readFeedback(ws)]);
    return NextResponse.json({ pipeline, feedback });
  } catch (err) {
    return NextResponse.json({ error: "Lecture impossible", details: String(err) }, { status: 500 });
  }
}

interface PostBody {
  action: "reject" | "approve" | "addUrl";
  url?: string;
  title?: string;
  company?: string;
  reason?: RejectionReason;
  note?: string;
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const ws = await getWs(params.id);
  if (!ws) return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });

  const body = (await req.json()) as PostBody;

  try {
    if (body.action === "addUrl") {
      if (!body.url) return NextResponse.json({ error: "URL manquante" }, { status: 400 });
      await appendPendingUrl(ws, body.url);
      return NextResponse.json({ ok: true });
    }

    if (body.action === "approve") {
      if (!body.url) return NextResponse.json({ error: "URL manquante" }, { status: 400 });
      await addApproval(ws, { url: body.url, title: body.title });
      return NextResponse.json({ ok: true });
    }

    if (body.action === "reject") {
      if (!body.url || !body.reason) {
        return NextResponse.json({ error: "URL et raison requises" }, { status: 400 });
      }
      const entry = await addRejection(ws, {
        url: body.url,
        title: body.title,
        company: body.company,
        reason: body.reason,
        note: body.note,
      });
      return NextResponse.json({ entry });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: "Action impossible", details: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const ws = await getWs(params.id);
  if (!ws) return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
  const url = new URL(req.url);
  const rejId = url.searchParams.get("rejectionId");
  if (!rejId) return NextResponse.json({ error: "rejectionId requis" }, { status: 400 });
  try {
    await removeRejection(ws, rejId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Suppression impossible", details: String(err) }, { status: 500 });
  }
}
