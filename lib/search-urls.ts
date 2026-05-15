import "server-only";
import { Workspace } from "@/types/workspace";
import { readProfileYml, readPortalsYml, extractPreferencesFromProfile, extractSourcesFromPortals } from "@/lib/workspace-files";
import { WizardPreferences, DEFAULT_DOMAINS } from "@/lib/preferences";
import { DEFAULT_SOURCES } from "@/lib/sources";

export interface BuiltSearch {
  sourceId: string;
  siteName: string;
  url: string;
  description: string;
  requiresLogin: "no" | "optional" | "recommended";
  category: "generaliste" | "banque-finance" | "alternance" | "carrieres-directes";
}

function buildKeywords(preferences: WizardPreferences): string[] {
  const labels = [
    ...preferences.domains
      .map((id) => DEFAULT_DOMAINS.find((d) => d.id === id)?.label)
      .filter(Boolean) as string[],
    ...preferences.customDomains,
  ];
  if (labels.length === 0) return ["conseiller"];
  return labels;
}

function urlEnc(s: string): string {
  return encodeURIComponent(s);
}

function getLocationLabel(preferences: WizardPreferences): string {
  return preferences.baseCity || "France";
}

function getMainKeyword(preferences: WizardPreferences): string {
  const kw = buildKeywords(preferences);
  return kw[0] ?? "conseiller";
}

function isAlternance(preferences: WizardPreferences): boolean {
  return preferences.contractTypes.includes("alternance");
}

function isCDI(preferences: WizardPreferences): boolean {
  return preferences.contractTypes.includes("cdi");
}

interface UrlBuilder {
  sourceId: string;
  builder: (prefs: WizardPreferences) => string;
  requiresLogin: BuiltSearch["requiresLogin"];
}

const URL_BUILDERS: UrlBuilder[] = [
  {
    sourceId: "france-travail",
    requiresLogin: "no",
    builder: (p) => {
      const kw = urlEnc(getMainKeyword(p));
      const loc = urlEnc(getLocationLabel(p));
      const types: string[] = [];
      if (isCDI(p)) types.push("CDI");
      if (p.contractTypes.includes("cdd")) types.push("CDD");
      if (isAlternance(p)) types.push("E2"); // E2 = alternance/apprentissage
      const typeParam = types.length > 0 ? `&typeContrat=${types.join(",")}` : "";
      return `https://candidat.francetravail.fr/offres/recherche?motsCles=${kw}&lieux=${loc}${typeParam}`;
    },
  },
  {
    sourceId: "apec",
    requiresLogin: "optional",
    builder: (p) => {
      const kw = urlEnc(getMainKeyword(p));
      const loc = urlEnc(getLocationLabel(p));
      return `https://www.apec.fr/candidat/recherche-emploi.html/emploi?motsCles=${kw}&lieux=${loc}`;
    },
  },
  {
    sourceId: "indeed-fr",
    requiresLogin: "no",
    builder: (p) => {
      const kw = urlEnc(getMainKeyword(p));
      const loc = urlEnc(getLocationLabel(p));
      return `https://fr.indeed.com/jobs?q=${kw}&l=${loc}&fromage=7`;
    },
  },
  {
    sourceId: "linkedin",
    requiresLogin: "recommended",
    builder: (p) => {
      const kw = urlEnc(getMainKeyword(p));
      const loc = urlEnc(getLocationLabel(p));
      const params: string[] = [`keywords=${kw}`, `location=${loc}`, "f_TPR=r604800"]; // r604800 = 7 derniers jours
      if (isCDI(p)) params.push("f_JT=F"); // Full-time
      return `https://www.linkedin.com/jobs/search/?${params.join("&")}`;
    },
  },
  {
    sourceId: "hellowork",
    requiresLogin: "no",
    builder: (p) => {
      const kw = urlEnc(getMainKeyword(p));
      const loc = urlEnc(getLocationLabel(p));
      return `https://www.hellowork.com/fr-fr/emploi/recherche.html?k=${kw}&l=${loc}&d=epc`;
    },
  },
  {
    sourceId: "wttj",
    requiresLogin: "no",
    builder: (p) => {
      const kw = urlEnc(getMainKeyword(p));
      const loc = urlEnc(getLocationLabel(p));
      return `https://www.welcometothejungle.com/fr/jobs?query=${kw}&aroundQuery=${loc}&refinementList%5Boffices.country_code%5D%5B%5D=FR`;
    },
  },
  {
    sourceId: "cadremploi",
    requiresLogin: "no",
    builder: (p) => {
      const kw = urlEnc(getMainKeyword(p));
      const loc = urlEnc(getLocationLabel(p));
      return `https://www.cadremploi.fr/emploi/liste_offres?motscles=${kw}&ville=${loc}`;
    },
  },
  {
    sourceId: "efinancialcareers",
    requiresLogin: "no",
    builder: (p) => {
      const kw = urlEnc(getMainKeyword(p));
      return `https://www.efinancialcareers.fr/search?location=fr&country=FR&keywords=${kw}`;
    },
  },
  {
    sourceId: "alternance-fr",
    requiresLogin: "no",
    builder: (p) => {
      const kw = urlEnc(getMainKeyword(p));
      return `https://www.alternance.fr/offre-alternance/recherche-alternance.html?Mots=${kw}`;
    },
  },
  {
    sourceId: "jobteaser",
    requiresLogin: "recommended",
    builder: (p) => {
      const kw = urlEnc(getMainKeyword(p));
      return `https://www.jobteaser.com/fr/job-offers?query=${kw}`;
    },
  },
  {
    sourceId: "ft-alternance",
    requiresLogin: "no",
    builder: (p) => {
      const kw = urlEnc(getMainKeyword(p));
      const loc = urlEnc(getLocationLabel(p));
      return `https://candidat.francetravail.fr/offres/recherche?motsCles=${kw}&lieux=${loc}&typeContrat=E2`;
    },
  },
];

const LOGIN_DESCRIPTIONS: Record<BuiltSearch["requiresLogin"], string> = {
  no: "Accessible sans compte. Tu peux consulter les annonces directement.",
  optional: "Compte optionnel — visible sans login mais plus complet avec ton compte.",
  recommended: "Connecte-toi à ton compte pour voir toutes les annonces et postuler en un clic.",
};

export async function buildSearchUrls(workspace: Workspace): Promise<BuiltSearch[]> {
  let preferences: WizardPreferences;
  let enabledSources: string[];

  try {
    const profile = await readProfileYml(workspace);
    preferences = extractPreferencesFromProfile(profile.parsed);
  } catch {
    const { DEFAULT_PREFERENCES } = await import("@/lib/preferences");
    preferences = DEFAULT_PREFERENCES;
  }

  try {
    const portals = await readPortalsYml(workspace);
    enabledSources = extractSourcesFromPortals(portals.parsed);
  } catch {
    enabledSources = [];
  }

  const results: BuiltSearch[] = [];
  for (const builder of URL_BUILDERS) {
    const source = DEFAULT_SOURCES.find((s) => s.id === builder.sourceId);
    if (!source) continue;
    if (enabledSources.length > 0 && !enabledSources.includes(builder.sourceId)) continue;

    try {
      const url = builder.builder(preferences);
      results.push({
        sourceId: builder.sourceId,
        siteName: source.name,
        url,
        description: LOGIN_DESCRIPTIONS[builder.requiresLogin],
        requiresLogin: builder.requiresLogin,
        category: source.category,
      });
    } catch {
      // skip on builder error
    }
  }

  return results;
}
