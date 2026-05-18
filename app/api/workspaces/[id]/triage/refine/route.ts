import { NextRequest, NextResponse } from "next/server";
import yaml from "yaml";
import { readAppConfig } from "@/lib/app-config";
import { readFeedback } from "@/lib/triage";
import { REJECTION_REASONS, FACTUAL_REJECTION_REASONS, getEntryReasons } from "@/lib/triage-types";
import { readPortalsYml, writePortalsYml } from "@/lib/workspace-files";
import { runClaude, isClaudeAvailable } from "@/lib/claude-runner";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

interface ProposalChange {
  field: string;
  action: "add" | "remove" | "set";
  value: unknown;
  reason: string;
}

async function getWs(id: string) {
  const config = await readAppConfig();
  return config.workspaces.find((w) => w.id === id);
}

const PROMPT_TEMPLATE = `Tu es un assistant qui aide à affiner des filtres de recherche d'emploi.

Voici la configuration actuelle de portals.yml :
"""
{{PORTALS_YAML}}
"""

Voici les rejets accumulés par l'utilisateur (offres qu'il a écartées et pourquoi) :
"""
{{FEEDBACK_JSON}}
"""

Légende des raisons :
{{REASONS_LEGEND}}

Analyse les rejets et propose des modifications concrètes à portals.yml pour éviter de revoir des offres similaires. Examples de modifications utiles :
- Ajouter un mot-clé négatif à title_filter.negative
- Ajouter une ville à location_filter.block
- Ajouter une entreprise à exclure (tracked_companies enabled: false ou nouveau champ blocked_companies)
- Augmenter le salaire minimum si plusieurs rejets pour ce motif
- Restreindre contract_types

Réponds STRICTEMENT au format JSON suivant, sans aucun autre texte avant ou après :

===JSON===
{
  "summary": "<résumé court en 1-2 phrases des patterns détectés>",
  "changes": [
    {
      "field": "<chemin du champ ex: title_filter.negative, location_filter.block, salary_filter.minimum_annual_eur>",
      "action": "add" | "remove" | "set",
      "value": <valeur — string, number ou array selon le cas>,
      "reason": "<explication courte en français>"
    }
  ]
}
===END===

Si tu n'as aucune proposition pertinente (par exemple s'il y a peu de rejets ou pas de pattern clair), renvoie un tableau vide pour "changes" et explique pourquoi dans "summary".`;

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const ws = await getWs(params.id);
  if (!ws) return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });

  try {
    const available = await isClaudeAvailable();
    if (!available) {
      return NextResponse.json(
        { error: "Claude CLI introuvable. Lance `claude --version` pour vérifier." },
        { status: 503 }
      );
    }

    const feedback = await readFeedback(ws);
    // Exclut les raisons factuelles (annonce-expiree) : ce sont des faits
    // externes (lien mort), pas des signaux de préférence dont l'IA peut
    // tirer des règles de filtrage.
    const signalRejections = feedback.rejections.filter((r) => {
      const reasons = getEntryReasons(r);
      return reasons.some((id) => !FACTUAL_REJECTION_REASONS.includes(id));
    });

    if (signalRejections.length === 0) {
      return NextResponse.json({
        summary:
          feedback.rejections.length === 0
            ? "Aucun rejet enregistré pour le moment. Marque quelques offres comme rejetées d'abord."
            : "Tes rejets ne contiennent que des raisons factuelles (annonces expirées). Rejette quelques offres avec des vraies raisons de préférence pour que l'IA puisse proposer des règles.",
        changes: [],
      });
    }

    const portals = await readPortalsYml(ws);

    const usableReasons = REJECTION_REASONS.filter((r) => !FACTUAL_REJECTION_REASONS.includes(r.id));
    const reasonsLegend = usableReasons.map((r) => `- ${r.id} : ${r.label} (${r.description})`).join("\n");

    const prompt = PROMPT_TEMPLATE
      .replace("{{PORTALS_YAML}}", portals.raw)
      .replace("{{FEEDBACK_JSON}}", JSON.stringify(signalRejections, null, 2))
      .replace("{{REASONS_LEGEND}}", reasonsLegend);

    const result = await runClaude({ prompt, timeout: 4 * 60 * 1000 });

    if (result.exitCode !== 0) {
      return NextResponse.json(
        { error: `Claude a renvoyé le code ${result.exitCode}.`, details: result.stderr },
        { status: 500 }
      );
    }

    const match = result.stdout.match(/===JSON===\s*([\s\S]*?)\s*===END===/);
    if (!match) {
      return NextResponse.json(
        { error: "Réponse Claude non parsable.", raw: result.stdout },
        { status: 500 }
      );
    }

    try {
      const parsed = JSON.parse(match[1].trim()) as {
        summary: string;
        changes: ProposalChange[];
      };
      return NextResponse.json(parsed);
    } catch (err) {
      return NextResponse.json(
        { error: "JSON proposé invalide.", details: String(err), raw: match[1] },
        { status: 500 }
      );
    }
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

interface ApplyBody {
  changes: ProposalChange[];
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const ws = await getWs(params.id);
  if (!ws) return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });

  const body = (await req.json()) as ApplyBody;
  if (!body.changes || body.changes.length === 0) {
    return NextResponse.json({ error: "Aucune modification à appliquer." }, { status: 400 });
  }

  try {
    const portals = await readPortalsYml(ws);
    const next = JSON.parse(JSON.stringify(portals.parsed)) as Record<string, unknown>;
    for (const change of body.changes) {
      applyChange(next, change);
    }
    await writePortalsYml(ws, next);
    return NextResponse.json({ ok: true, applied: body.changes.length });
  } catch (err) {
    return NextResponse.json({ error: "Application impossible", details: String(err) }, { status: 500 });
  }
}

function applyChange(target: Record<string, unknown>, change: ProposalChange): void {
  const segments = change.field.split(".").filter(Boolean);
  if (segments.length === 0) return;

  let cursor: Record<string, unknown> = target;
  for (let i = 0; i < segments.length - 1; i++) {
    const k = segments[i];
    if (typeof cursor[k] !== "object" || cursor[k] === null || Array.isArray(cursor[k])) {
      cursor[k] = {};
    }
    cursor = cursor[k] as Record<string, unknown>;
  }

  const lastKey = segments[segments.length - 1];

  if (change.action === "set") {
    cursor[lastKey] = change.value;
    return;
  }

  if (change.action === "add") {
    const existing = cursor[lastKey];
    if (Array.isArray(existing)) {
      const valuesToAdd = Array.isArray(change.value) ? change.value : [change.value];
      for (const v of valuesToAdd) {
        if (!existing.includes(v)) existing.push(v);
      }
    } else if (existing === undefined) {
      cursor[lastKey] = Array.isArray(change.value) ? change.value : [change.value];
    } else {
      cursor[lastKey] = change.value;
    }
    return;
  }

  if (change.action === "remove") {
    const existing = cursor[lastKey];
    if (Array.isArray(existing)) {
      const valuesToRemove = Array.isArray(change.value) ? change.value : [change.value];
      cursor[lastKey] = existing.filter((v) => !valuesToRemove.includes(v));
    } else {
      delete cursor[lastKey];
    }
  }
}
