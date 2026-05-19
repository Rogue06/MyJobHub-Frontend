import yaml from "yaml";
import { WizardPreferences, CONTRACT_TYPES, DEFAULT_DOMAINS } from "@/lib/preferences";
import { DEFAULT_SOURCES } from "@/lib/sources";

export interface ProfileFromWizard {
  candidate?: Record<string, unknown>;
  target_roles?: Record<string, unknown>;
  narrative?: Record<string, unknown>;
  compensation?: Record<string, unknown>;
  location?: Record<string, unknown>;
  cv?: Record<string, unknown>;
  [key: string]: unknown;
}

export function buildProfileYaml(
  baseProfile: ProfileFromWizard,
  preferences: WizardPreferences
): string {
  const contractLabels = preferences.contractTypes
    .map((id) => CONTRACT_TYPES.find((c) => c.id === id)?.label)
    .filter(Boolean) as string[];

  const domainLabels = [
    ...preferences.domains
      .map((id) => DEFAULT_DOMAINS.find((d) => d.id === id)?.label)
      .filter(Boolean) as string[],
    ...preferences.customDomains,
  ];

  // Préserve aussi les domaines existants du target_roles (fusion union).
  const existingTr = (baseProfile.target_roles as Record<string, unknown> | undefined) ?? {};
  const existingDomains = (existingTr.domains as string[] | undefined) ?? [];
  const mergedDomains = Array.from(new Set([...domainLabels, ...existingDomains].filter(Boolean)));

  const merged: ProfileFromWizard = {
    ...baseProfile,
    target_roles: {
      ...existingTr,
      contract_types: contractLabels,
      domains: mergedDomains,
      seniority: preferences.seniority,
    },
    compensation: {
      ...(baseProfile.compensation as Record<string, unknown> | undefined),
      currency: "EUR",
      target_annual: preferences.salaryTarget,
      minimum_annual: preferences.salaryMin,
    },
    location: {
      ...(baseProfile.location as Record<string, unknown> | undefined),
      country: "France",
      city: preferences.baseCity,
      mobility_km: preferences.mobilityKm,
      remote_ok: preferences.remoteOk,
      preferred_locations: preferences.preferredLocations,
      excluded_locations: preferences.excludedLocations,
    },
  };

  return yaml.stringify(merged, { lineWidth: 100 });
}

export interface PortalsConfig {
  trackedCompanies: { name: string; url: string; enabled: boolean }[];
  locationAllow: string[];
  locationBlock: string[];
  titlePositive: string[];
  titleNegative: string[];
  salaryMinAnnual?: number;
}

/**
 * Construit portals.yml en MERGE-mode : préserve les champs custom que l'UI
 * ne contrôle pas encore (title_filter.negative, zones ajoutées à la main…)
 * et fait l'union avec ce que les préférences UI imposent. Sinon, chaque
 * « Enregistrer » écrasait les 39 zones et les filtres titre ajoutés au yaml.
 *
 * Champs sous contrôle UI total (écrasés par les prefs) :
 *   - tracked_companies (Sources tab)
 *   - salary_filter.minimum_annual_eur (Préférences > Rémunération)
 *   - contract_types (Préférences > Contrats)
 *   - seniority (Préférences > Niveau d'expérience)
 *
 * Champs en union (ajout par UI, pas de suppression depuis UI) :
 *   - title_filter.positive (prefs.domains + customDomains + existing positifs)
 *   - location_filter.allow (baseCity + preferredLocations + remote + existing zones)
 *   - location_filter.block (excludedLocations + existing block)
 *
 * Champs purement préservés (l'UI ne les touche pas) :
 *   - title_filter.negative (faut éditer le yaml à la main, pour l'instant)
 *   - tout autre champ top-level inconnu
 */
export function buildPortalsYaml(
  enabledSourceIds: string[],
  preferences: WizardPreferences,
  existing: Record<string, unknown> = {}
): string {
  const enabled = DEFAULT_SOURCES.filter((s) => enabledSourceIds.includes(s.id));
  const tracked = enabled.map((s) => ({
    name: s.name,
    careers_url: s.url,
    enabled: true,
  }));

  const domainLabels = [
    ...preferences.domains
      .map((id) => DEFAULT_DOMAINS.find((d) => d.id === id)?.label)
      .filter(Boolean) as string[],
    ...preferences.customDomains,
  ];

  const prefAllow: string[] = [];
  if (preferences.remoteOk) prefAllow.push("Télétravail", "Remote");
  if (preferences.baseCity) prefAllow.push(preferences.baseCity);
  prefAllow.push(...preferences.preferredLocations);

  const uniq = (arr: string[]) => Array.from(new Set(arr.filter((x) => x && x.length > 0)));

  const existingTitle = (existing.title_filter ?? {}) as Record<string, unknown>;
  const existingLocation = (existing.location_filter ?? {}) as Record<string, unknown>;
  const existingPositive = (existingTitle.positive as string[] | undefined) ?? [];
  const existingNegative = (existingTitle.negative as string[] | undefined) ?? [];
  const existingAllow = (existingLocation.allow as string[] | undefined) ?? [];
  const existingBlock = (existingLocation.block as string[] | undefined) ?? [];

  const data: Record<string, unknown> = {
    // Préserve tout ce que l'UI ne connaît pas (custom_zones, notes_top, etc.).
    ...existing,
    tracked_companies: tracked,
    title_filter: {
      positive: uniq([...domainLabels, ...existingPositive]),
      negative: existingNegative,
    },
    location_filter: {
      allow: uniq([...prefAllow, ...existingAllow]),
      block: uniq([...preferences.excludedLocations, ...existingBlock]),
    },
    salary_filter: {
      minimum_annual_eur: preferences.salaryMin,
    },
    contract_types: preferences.contractTypes,
    seniority: preferences.seniority,
  };

  return yaml.stringify(data, { lineWidth: 100 });
}
