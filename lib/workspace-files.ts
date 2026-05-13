import { promises as fs } from "node:fs";
import path from "node:path";
import yaml from "yaml";
import { Workspace } from "@/types/workspace";
import { getCareerOpsPath } from "@/lib/workspace";
import { WizardPreferences, DEFAULT_PREFERENCES, DEFAULT_DOMAINS, CONTRACT_TYPES } from "@/lib/preferences";
import { DEFAULT_SOURCES } from "@/lib/sources";

export interface WorkspaceProfile {
  raw: string;
  parsed: Record<string, unknown>;
}

export async function readProfileYml(workspace: Workspace): Promise<WorkspaceProfile> {
  const filePath = path.join(getCareerOpsPath(workspace), "config", "profile.yml");
  const raw = await fs.readFile(filePath, "utf-8");
  const parsed = (yaml.parse(raw) ?? {}) as Record<string, unknown>;
  return { raw, parsed };
}

export async function writeProfileYml(workspace: Workspace, data: Record<string, unknown>): Promise<void> {
  const filePath = path.join(getCareerOpsPath(workspace), "config", "profile.yml");
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, yaml.stringify(data, { lineWidth: 100 }), "utf-8");
}

export async function readPortalsYml(workspace: Workspace): Promise<WorkspaceProfile> {
  const filePath = path.join(getCareerOpsPath(workspace), "portals.yml");
  const raw = await fs.readFile(filePath, "utf-8");
  const parsed = (yaml.parse(raw) ?? {}) as Record<string, unknown>;
  return { raw, parsed };
}

export async function writePortalsYml(workspace: Workspace, data: Record<string, unknown>): Promise<void> {
  const filePath = path.join(getCareerOpsPath(workspace), "portals.yml");
  await fs.writeFile(filePath, yaml.stringify(data, { lineWidth: 100 }), "utf-8");
}

export async function readCvMd(workspace: Workspace): Promise<string> {
  const filePath = path.join(getCareerOpsPath(workspace), "cv.md");
  return fs.readFile(filePath, "utf-8");
}

export async function writeCvMd(workspace: Workspace, content: string): Promise<void> {
  const filePath = path.join(getCareerOpsPath(workspace), "cv.md");
  await fs.writeFile(filePath, content, "utf-8");
}

export function extractPreferencesFromProfile(profile: Record<string, unknown>): WizardPreferences {
  const tr = (profile.target_roles ?? {}) as Record<string, unknown>;
  const comp = (profile.compensation ?? {}) as Record<string, unknown>;
  const loc = (profile.location ?? {}) as Record<string, unknown>;

  const contractLabels = (tr.contract_types as string[] | undefined) ?? [];
  const contractTypes = contractLabels
    .map((label) => CONTRACT_TYPES.find((c) => c.label === label || c.id === label)?.id)
    .filter(Boolean) as string[];

  const domainLabels = (tr.domains as string[] | undefined) ?? [];
  const domains: string[] = [];
  const customDomains: string[] = [];
  for (const label of domainLabels) {
    const match = DEFAULT_DOMAINS.find((d) => d.label === label || d.id === label);
    if (match) domains.push(match.id);
    else customDomains.push(label);
  }

  return {
    ...DEFAULT_PREFERENCES,
    contractTypes: contractTypes.length > 0 ? contractTypes : DEFAULT_PREFERENCES.contractTypes,
    domains,
    customDomains,
    seniority: (tr.seniority as WizardPreferences["seniority"]) ?? DEFAULT_PREFERENCES.seniority,
    salaryMin: Number(comp.minimum_annual ?? DEFAULT_PREFERENCES.salaryMin),
    salaryTarget: Number(comp.target_annual ?? DEFAULT_PREFERENCES.salaryTarget),
    baseCity: String(loc.city ?? ""),
    mobilityKm: Number(loc.mobility_km ?? DEFAULT_PREFERENCES.mobilityKm),
    remoteOk: Boolean(loc.remote_ok ?? DEFAULT_PREFERENCES.remoteOk),
    preferredLocations: (loc.preferred_locations as string[] | undefined) ?? [],
    excludedLocations: (loc.excluded_locations as string[] | undefined) ?? [],
  };
}

export function extractSourcesFromPortals(portals: Record<string, unknown>): string[] {
  const tracked = (portals.tracked_companies as Array<{ name?: string; careers_url?: string }> | undefined) ?? [];
  const ids: string[] = [];
  for (const t of tracked) {
    const match = DEFAULT_SOURCES.find(
      (s) => s.name === t.name || s.url === t.careers_url || s.id === t.name
    );
    if (match) ids.push(match.id);
  }
  return ids;
}

export function extractIdentityFromProfile(profile: Record<string, unknown>): {
  full_name?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  portfolio_url?: string;
  github?: string;
  headline?: string;
  exit_story?: string;
  superpowers?: string[];
  primary_roles?: string[];
} {
  const candidate = (profile.candidate ?? {}) as Record<string, unknown>;
  const narrative = (profile.narrative ?? {}) as Record<string, unknown>;
  const target = (profile.target_roles ?? {}) as Record<string, unknown>;
  return {
    full_name: (candidate.full_name as string) ?? "",
    email: (candidate.email as string) ?? "",
    phone: (candidate.phone as string) ?? "",
    location: (candidate.location as string) ?? "",
    linkedin: (candidate.linkedin as string) ?? "",
    portfolio_url: (candidate.portfolio_url as string) ?? "",
    github: (candidate.github as string) ?? "",
    headline: (narrative.headline as string) ?? "",
    exit_story: (narrative.exit_story as string) ?? "",
    superpowers: (narrative.superpowers as string[] | undefined) ?? [],
    primary_roles: (target.primary as string[] | undefined) ?? [],
  };
}

export function mergeIdentityIntoProfile(
  profile: Record<string, unknown>,
  identity: ReturnType<typeof extractIdentityFromProfile>
): Record<string, unknown> {
  return {
    ...profile,
    candidate: {
      ...(profile.candidate as Record<string, unknown> | undefined),
      full_name: identity.full_name,
      email: identity.email,
      phone: identity.phone,
      location: identity.location,
      linkedin: identity.linkedin,
      portfolio_url: identity.portfolio_url,
      github: identity.github,
    },
    narrative: {
      ...(profile.narrative as Record<string, unknown> | undefined),
      headline: identity.headline,
      exit_story: identity.exit_story,
      superpowers: identity.superpowers ?? [],
    },
    target_roles: {
      ...(profile.target_roles as Record<string, unknown> | undefined),
      primary: identity.primary_roles ?? [],
    },
  };
}
