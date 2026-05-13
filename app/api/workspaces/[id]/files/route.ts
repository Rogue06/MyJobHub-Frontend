import { NextRequest, NextResponse } from "next/server";
import { readAppConfig } from "@/lib/app-config";
import {
  readCvMd,
  readPortalsYml,
  readProfileYml,
  writeCvMd,
  writePortalsYml,
  writeProfileYml,
  extractIdentityFromProfile,
  extractPreferencesFromProfile,
  extractSourcesFromPortals,
  mergeIdentityIntoProfile,
} from "@/lib/workspace-files";
import { buildPortalsYaml, buildProfileYaml } from "@/lib/yaml-builders";
import { WizardPreferences } from "@/lib/preferences";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function getWorkspace(id: string) {
  const config = await readAppConfig();
  return config.workspaces.find((w) => w.id === id);
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const ws = await getWorkspace(params.id);
  if (!ws) return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });

  const result: Record<string, unknown> = {};
  try {
    const profile = await readProfileYml(ws);
    result.profile = {
      raw: profile.raw,
      parsed: profile.parsed,
      identity: extractIdentityFromProfile(profile.parsed),
      preferences: extractPreferencesFromProfile(profile.parsed),
    };
  } catch (err) {
    result.profile = { error: String(err) };
  }
  try {
    const portals = await readPortalsYml(ws);
    result.portals = {
      raw: portals.raw,
      parsed: portals.parsed,
      enabledSources: extractSourcesFromPortals(portals.parsed),
    };
  } catch (err) {
    result.portals = { error: String(err) };
  }
  try {
    result.cv = await readCvMd(ws);
  } catch (err) {
    result.cv = { error: String(err) };
  }
  return NextResponse.json(result);
}

interface FilesPayload {
  identity?: Parameters<typeof mergeIdentityIntoProfile>[1];
  preferences?: WizardPreferences;
  enabledSources?: string[];
  cv?: string;
  profileRaw?: string;
  portalsRaw?: string;
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const ws = await getWorkspace(params.id);
  if (!ws) return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });

  const body = (await req.json()) as FilesPayload;
  const written: string[] = [];

  try {
    if (body.cv !== undefined) {
      await writeCvMd(ws, body.cv);
      written.push("cv.md");
    }

    if (body.profileRaw !== undefined) {
      const yamlModule = await import("yaml");
      const parsed = (yamlModule.default.parse(body.profileRaw) ?? {}) as Record<string, unknown>;
      await writeProfileYml(ws, parsed);
      written.push("config/profile.yml");
    } else if (body.identity || body.preferences) {
      const current = await readProfileYml(ws).catch(() => ({ parsed: {} as Record<string, unknown> }));
      let next = current.parsed;
      if (body.identity) next = mergeIdentityIntoProfile(next, body.identity);
      if (body.preferences) {
        const yamlStr = buildProfileYaml(next, body.preferences);
        const yamlModule = await import("yaml");
        next = (yamlModule.default.parse(yamlStr) ?? {}) as Record<string, unknown>;
      }
      await writeProfileYml(ws, next);
      written.push("config/profile.yml");
    }

    if (body.portalsRaw !== undefined) {
      const yamlModule = await import("yaml");
      const parsed = (yamlModule.default.parse(body.portalsRaw) ?? {}) as Record<string, unknown>;
      await writePortalsYml(ws, parsed);
      written.push("portals.yml");
    } else if (body.enabledSources !== undefined || body.preferences) {
      const current = await readPortalsYml(ws).catch(() => ({ parsed: {} as Record<string, unknown> }));
      const enabled = body.enabledSources ?? extractSourcesFromPortals(current.parsed);
      const prefs = body.preferences ?? extractPreferencesFromProfileFallback(ws);
      const portalsYaml = buildPortalsYaml(enabled, await prefs);
      const yamlModule = await import("yaml");
      const parsed = (yamlModule.default.parse(portalsYaml) ?? {}) as Record<string, unknown>;
      await writePortalsYml(ws, parsed);
      written.push("portals.yml");
    }

    return NextResponse.json({ ok: true, written });
  } catch (err) {
    return NextResponse.json(
      { error: "Écriture impossible", details: String(err) },
      { status: 500 }
    );
  }
}

async function extractPreferencesFromProfileFallback(
  ws: Parameters<typeof readProfileYml>[0]
): Promise<WizardPreferences> {
  try {
    const profile = await readProfileYml(ws);
    return extractPreferencesFromProfile(profile.parsed);
  } catch {
    const { DEFAULT_PREFERENCES } = await import("@/lib/preferences");
    return DEFAULT_PREFERENCES;
  }
}
