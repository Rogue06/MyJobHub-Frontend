export const JOB_SEARCH_TIPS: string[] = [
  "Une bonne accroche tient en une phrase : qui tu es, ce que tu cherches, pourquoi maintenant.",
  "Vise plutôt 5–10 candidatures bien préparées qu'un déluge d'envois génériques.",
  "Relance 7 jours après l'envoi : un simple « toujours intéressé(e), avez-vous des nouvelles ? » suffit.",
  "Lis l'annonce 2 fois, surligne les 5 mots-clés qui reviennent, et place-les dans ton CV.",
  "Sur LinkedIn, contacte un peer du poste avant de candidater. Une question sincère ouvre plus de portes qu'une demande.",
  "Ton CV doit tenir sur une page si tu as moins de 7 ans d'expérience. Sois impitoyable.",
  "L'expérience la plus récente compte triple : détaille-la avec des chiffres (€, %, nb de clients…).",
  "Pour un entretien, prépare 3 anecdotes au format STAR (Situation, Tâche, Action, Résultat).",
  "Avant de candidater, demande-toi : « est-ce que je veux vraiment ce poste ? ». Si non, passe.",
  "Note tes refus pour identifier les patterns : compétence manquante ? secteur mal aligné ? salaire bas ?",
  "Le scan complet IA visite tous tes sites portails un par un. C'est plus lent mais beaucoup plus complet.",
  "Lance un scan quotidien le matin : les recruteurs publient surtout en début de semaine.",
  "Une lettre de motivation lue en 30 secondes. Garde 3 paragraphes courts : pourquoi eux, pourquoi toi, ce que tu apportes.",
  "Si l'annonce mentionne « stack technique », place les techs maîtrisées en haut de ton CV.",
  "Connais ton fourchette salariale avant l'entretien. Refuse de donner un chiffre avant qu'on te le demande.",
  "Pour une alternance, mets en avant ce que tu vas apprendre, pas seulement ce que tu sais déjà.",
  "Les banques recrutent souvent via cooptation. Active ton réseau LinkedIn (anciens stages, école…).",
  "Sur un entretien à distance, regarde la caméra, pas l'écran. Ça change tout.",
  "Une candidature spontanée n'est jamais perdue : elle revient quand un poste s'ouvre.",
  "Si tu hésites entre 2 offres, écris les avantages/inconvénients à la main. Le cerveau choisit avant la plume.",
];

export function pickRotatingTip(seconds: number, intervalSec: number = 10): string {
  const idx = Math.floor(seconds / intervalSec) % JOB_SEARCH_TIPS.length;
  return JOB_SEARCH_TIPS[idx];
}
