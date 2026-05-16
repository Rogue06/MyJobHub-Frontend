# Captures d'écran de MyJobHub

Ce dossier contient les captures utilisées dans le README principal du projet. Pour les régénérer ou les remplacer, suis ce guide.

## Captures attendues

Le README charge ces fichiers dans l'ordre :

| Fichier | Page | Ce qu'on doit y voir |
|---------|------|----------------------|
| `01-dashboard-top.png` ⭐ | `/` (Tableau de bord) | Bannière d'accueil + recommandations + statistiques |
| `02-dashboard-quick-actions.png` ⭐ | `/` (Tableau de bord, plus bas) | Section « Accès rapide » + astuce du jour |
| `03-triage-scan.png` | `/triage` (onglet Inbox) | Carte « Scanner les sites » + 3 boutons + sélecteur de modèle |
| `04-actions.png` | `/actions` | Vue d'ensemble avec les groupes d'usage colorés et le bouton « Utiliser les recos » |
| `05-wizard.png` | `/profils/nouveau` | Wizard d'onboarding (idéalement étape 1 ou 3 avec import PDF) |
| `06-evaluer.png` | `/evaluer` | Formulaire d'évaluation + logs streaming pendant une exécution |
| `07-candidatures.png` | `/candidatures` | Tableau des candidatures avec scores, statuts, filtres |
| `08-triage-rejets.png` | `/triage` (onglet « Affiner les filtres ») | Module filtre apprenant en action |
| `09-recherches.png` | `/recherches` | Page Recherches en direct avec URLs pré-remplies |

Les deux marquées ⭐ apparaissent en grand dans le README principal. Les autres sont liées en lien-texte (mais peuvent aussi devenir des `![]()` plus tard).

## Comment prendre les captures (macOS)

1. Lance MyJobHub via le raccourci Bureau (`MyJobHub.command`)
2. Ouvre le navigateur sur `http://localhost:3000`
3. Pour chaque écran ci-dessus :
   - Navigue vers la page
   - **`Cmd+Shift+4`** puis **`Espace`** pour capturer juste la fenêtre (ombre incluse)
   - Ou **`Cmd+Shift+4`** puis sélection rectangulaire si tu veux cropper
4. Renomme la capture selon le tableau ci-dessus
5. Place-la dans `docs/screenshots/`

## Comment les commit et push

```bash
cd /chemin/vers/MyJobHub-Frontend
git add docs/screenshots/
git commit -m "docs: ajoute les captures d'écran de l'interface"
git push
```

## Conseils pour de belles captures

- **Mode clair OU sombre, sois cohérent** — soit tu fais tout en clair, soit tout en sombre. Évite le mix.
- **Fenêtre raisonnable** : ~1400×900 px est idéal (pas trop large, pas trop étroit).
- **Données réelles mais sans info perso sensible** : tes profils c'est cool, mais évite si possible les emails/téléphones perso visibles. Tu peux masquer en floutant.
- **État « rempli »** : une page Candidatures vide n'est pas vendeuse. Si possible capture après avoir lancé au moins une évaluation.
- **Format PNG** (pas JPEG) — meilleure netteté pour les UIs.

## Limite de taille

Évite les captures > 1 Mo (compression GitHub limitée à 100 Mo / fichier mais pour le repo c'est mieux léger). Utilise [TinyPNG](https://tinypng.com) ou `pngquant` si besoin.
