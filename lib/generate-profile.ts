import yaml from "yaml";
import { runClaude } from "@/lib/claude-runner";

export interface GeneratedProfile {
  cvMarkdown: string;
  profileYaml: string;
  profile: Record<string, unknown>;
  rawOutput: string;
}

const PROMPT_TEMPLATE = `Tu es un assistant qui aide à structurer un CV pour le système open-source career-ops.

Voici le texte brut extrait d'un CV en français (issu d'un PDF). Génère deux fichiers à partir de ce texte :

1. cv.md : un CV propre en markdown, avec ces sections dans cet ordre :
   - # Identité (nom, email, téléphone, ville, LinkedIn si présent)
   - ## Profil professionnel (résumé de 2-3 lignes)
   - ## Expérience professionnelle (chaque poste avec dates, entreprise, rôle, 3-5 puces de réalisations)
   - ## Formation (chaque diplôme avec dates, école, intitulé)
   - ## Compétences (liste à puces, regroupée par catégorie si pertinent)
   - ## Langues (langue + niveau)
   - ## Centres d'intérêt (si mentionnés dans le CV)

2. profile.yml : YAML pré-rempli au format career-ops, avec ces clés :
   - candidate: { full_name, email, phone, location, linkedin, portfolio_url, github }
   - target_roles: { primary: [liste de 2-3 intitulés cibles déduits du CV] }
   - narrative: { headline (1 phrase d'accroche), exit_story (1-2 phrases), superpowers: [3-5 forces principales] }
   - compensation: { target_range: "à compléter", currency: "EUR" }
   - location: { country: "France", city: <ville du CV> }
   - cv: { output_format: "html" }

Réponds STRICTEMENT dans ce format, sans aucun autre texte avant ou après :

===CV_MARKDOWN===
<contenu de cv.md ici>
===PROFILE_YAML===
<contenu de profile.yml ici>
===END===

Voici le texte brut du CV à structurer :
"""
{{PDF_TEXT}}
"""`;

export async function generateProfileFromPdf(pdfText: string): Promise<GeneratedProfile> {
  const prompt = PROMPT_TEMPLATE.replace("{{PDF_TEXT}}", pdfText);

  const result = await runClaude({
    prompt,
    timeout: 4 * 60 * 1000,
  });

  if (result.exitCode !== 0) {
    throw new Error(
      `Claude CLI a échoué (code ${result.exitCode}). ${result.stderr || result.stdout}`
    );
  }

  const output = result.stdout;
  const cvMatch = output.match(/===CV_MARKDOWN===\s*\n([\s\S]*?)\n===PROFILE_YAML===/);
  const yamlMatch = output.match(/===PROFILE_YAML===\s*\n([\s\S]*?)\n===END===/);

  if (!cvMatch || !yamlMatch) {
    throw new Error(
      "La réponse de Claude n'est pas dans le format attendu. Sortie brute conservée — tu peux saisir manuellement."
    );
  }

  const cvMarkdown = cvMatch[1].trim();
  const profileYaml = yamlMatch[1].trim();

  let profile: Record<string, unknown> = {};
  try {
    profile = yaml.parse(profileYaml) as Record<string, unknown>;
  } catch (err) {
    throw new Error(`Le YAML généré n'est pas valide : ${String(err)}`);
  }

  return {
    cvMarkdown,
    profileYaml,
    profile,
    rawOutput: output,
  };
}
