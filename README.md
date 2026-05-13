# Boussole

Interface graphique en français pour [career-ops](https://github.com/santifer/career-ops), l'outil open-source de recherche d'emploi assistée par IA.

Boussole rend career-ops accessible sans terminal : un assistant guidé importe ton CV PDF et configure tout, des éditeurs visuels remplacent les fichiers YAML, et un système de triage avec filtre apprenant t'aide à affiner ce que l'IA cherche pour toi.

## Pourquoi Boussole

career-ops est puissant mais demande de connaître Claude Code CLI, d'éditer des YAML à la main et de mémoriser une quinzaine de slash commands. Boussole apporte une interface web simple, en français, qui :

- Guide la création d'un profil pas à pas avec import direct d'un CV PDF
- Remplace les fichiers `cv.md`, `config/profile.yml`, `portals.yml` par des formulaires lisibles
- Supporte plusieurs profils en parallèle (ex. recherche d'emploi + recherche d'alternance) dans des dossiers indépendants
- Pré-charge une trentaine de sites d'annonces français, tous activables/désactivables
- Lance une évaluation d'offre depuis un copier-coller d'URL avec affichage temps réel
- Affiche tes candidatures (depuis `data/applications.md`) avec statistiques
- Permet un **triage des annonces** avec apprentissage : tu marques ce que tu rejettes et Claude propose automatiquement des règles de filtrage à ajouter à `portals.yml`
- Liste les CV et lettres de motivation générés, avec bouton « ouvrir » et « révéler dans le Finder »

## Architecture

```
~/.boussole/config.json                  Configuration globale Boussole (liste des profils)

<dossier-utilisateur>/<profil>/          Workspace d'un profil
└── career-ops/                          Clone autonome de career-ops
    ├── cv.md                            Données utilisateur
    ├── config/profile.yml               Données utilisateur
    ├── portals.yml                      Données utilisateur
    ├── data/                            Tracker, pipeline, feedback Boussole
    ├── reports/, output/                Sorties générées
    └── modes/, *.mjs, dashboard/…       Sources de career-ops (jamais modifiées)
```

Chaque profil contient un clone complet et autonome de career-ops. Boussole n'écrit jamais dans les fichiers du système career-ops — uniquement dans tes données. Tu peux toujours `cd <workspace>/career-ops && claude` directement pour utiliser career-ops sans Boussole.

## Prérequis

- **Node.js 22 LTS** (un `.nvmrc` est inclus)
- **Git** (pour cloner career-ops dans chaque profil)
- **Claude Code CLI** installé et authentifié (`claude --version` doit fonctionner)
- macOS, Windows ou Linux

## Installation

```bash
git clone https://github.com/<ton-user>/boussole.git
cd boussole
nvm use            # active Node 22 via .nvmrc
npm install
npm run dev
```

L'app tourne sur [http://localhost:3000](http://localhost:3000).

## Premier profil

1. Ouvre [http://localhost:3000](http://localhost:3000)
2. Clique sur « Créer un profil »
3. Donne-lui un nom (ex. *Emploi banque*) et choisis un dossier parent
4. Glisse ton CV PDF — l'IA en extrait le texte et structure automatiquement `cv.md` et `profile.yml`
5. Vérifie le résultat, ajuste tes préférences (contrat, domaines, salaire, mobilité)
6. Coche les sites d'annonces à scanner
7. Lance l'installation : Boussole clone career-ops, installe les dépendances et configure tout

Compter **2 à 4 minutes** la première fois (clone + `npm install` + `playwright install`).

## Mettre à jour career-ops

Dans la page **Configuration**, le bouton « Mettre à jour career-ops » exécute :

```bash
git pull --rebase --autostash    # tes fichiers locaux sont préservés
npm install
npm run doctor
```

Si tu utilises ton propre fork plutôt que `santifer/career-ops`, ajoute le remote upstream une fois :

```bash
cd <workspace>/career-ops
git remote add upstream https://github.com/santifer/career-ops.git
git fetch upstream
git merge upstream/main
```

## Modules

| Module | Description |
|--------|-------------|
| **Tableau de bord** | Vue d'ensemble du profil actif et accès rapide aux actions |
| **Évaluer une offre** | Colle une URL ou un texte d'annonce ; Claude évalue, génère CV adapté et rapport |
| **Triage des annonces** | Marque ce que tu gardes ou rejettes ; Claude apprend de tes rejets et propose des règles de filtre |
| **Candidatures** | Tracker visuel de `data/applications.md` avec stats et filtres |
| **Documents** | Galerie des PDF (CV adaptés, lettres de motivation, rapports) |
| **Configuration** | Éditeurs visuels du profil, des préférences, des sources et du CV |
| **Profils** | Gestion multi-profils (création, activation, suppression) |

## Stack technique

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS 3** + **shadcn/ui** (sur Base UI)
- **pdf-parse** v2 pour l'extraction de texte
- **yaml** pour la lecture/écriture des fichiers YAML
- **sonner** pour les notifications
- Server-Sent Events pour le streaming en direct des commandes longues (`git clone`, `npm install`, `claude -p …`)

## Dissociation avec career-ops

Boussole est un projet indépendant qui appelle career-ops via :

1. Le CLI de Claude Code (`claude -p "/career-ops …"`)
2. Les scripts npm de career-ops (`npm run scan`, `npm run pdf`, etc.)
3. Lecture/écriture de fichiers user-data uniquement (`cv.md`, `config/profile.yml`, `portals.yml`, `data/*`)

Boussole ne fork pas career-ops, ne modifie pas ses sources, ne le redistribue pas. Le clone effectué dans chaque profil pointe sur `https://github.com/santifer/career-ops` ou un fork de ton choix.

## Licence

MIT — voir [LICENSE](LICENSE).

career-ops est lui-même sous MIT, par [Santiago Fernández](https://santifer.io). Boussole respecte la [TRADEMARK Policy](https://github.com/santifer/career-ops/blob/main/TRADEMARK.md) de career-ops en n'utilisant pas le nom dans son identité de projet.
