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

  const merged: ProfileFromWizard = {
    ...baseProfile,
    target_roles: {
      ...(baseProfile.target_roles as Record<string, unknown> | undefined),
      contract_types: contractLabels,
      domains: domainLabels,
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

export function buildPortalsYaml(
  enabledSourceIds: string[],
  preferences: WizardPreferences
): string {
  const enabled = DEFAULT_SOURCES.filter((s) => enabledSourceIds.includes(s.id));
  const tracked = enabled.map((s) => ({
    name: s.name,
    careers_url: s.url,
    enabled: true,
  }));

  const titlePositive = [
    ...preferences.domains
      .map((id) => DEFAULT_DOMAINS.find((d) => d.id === id)?.label)
      .filter(Boolean) as string[],
    ...preferences.customDomains,
  ];

  const locationAllow: string[] = [];
  if (preferences.remoteOk) {
    locationAllow.push("Télétravail", "Remote");
  }
  if (preferences.baseCity) {
    locationAllow.push(preferences.baseCity);
  }
  locationAllow.push(...preferences.preferredLocations);

  const data = {
    tracked_companies: tracked,
    title_filter: {
      positive: titlePositive,
      negative: [],
    },
    location_filter: {
      allow: locationAllow,
      block: preferences.excludedLocations,
    },
    salary_filter: {
      minimum_annual_eur: preferences.salaryMin,
    },
    contract_types: preferences.contractTypes,
    seniority: preferences.seniority,
  };

  return yaml.stringify(data, { lineWidth: 100 });
}
