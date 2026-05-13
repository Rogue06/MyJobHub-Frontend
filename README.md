# MyJobHub

> Interface graphique pour [`santifer/career-ops`](https://github.com/santifer/career-ops) — recherche d'emploi assistée par IA, sans terminal ni édition YAML.
>
> A graphical interface for [`santifer/career-ops`](https://github.com/santifer/career-ops) — AI-assisted job hunting, with no terminal or YAML editing.

[🇫🇷 Français](#français) · [🇬🇧 English](#english)

---

## Français

MyJobHub est une application web locale qui rend [career-ops](https://github.com/santifer/career-ops) accessible à toute personne en recherche d'emploi, sans avoir à manipuler de fichiers YAML ni à mémoriser de slash commands. Un assistant guidé importe ton CV PDF, configure le profil, génère les fichiers attendus par career-ops et lance les évaluations d'offres en un clic.

### Pourquoi MyJobHub

career-ops est un outil puissant mais conçu pour des utilisateurs à l'aise avec Claude Code CLI et l'édition manuelle de fichiers de configuration. MyJobHub apporte une couche d'usage simple, en français, qui :

- **Onboarde sans douleur** : assistant en 6 étapes avec import de CV PDF et structuration automatique par l'IA
- **Cache la complexité YAML** : éditeurs visuels pour `cv.md`, `config/profile.yml`, `portals.yml`
- **Supporte plusieurs profils** indépendants côte à côte (ex. recherche d'emploi + recherche d'alternance)
- **Pré-charge 30+ sites d'annonces français** activables/désactivables (France Travail, APEC, Indeed, LinkedIn, HelloWork, Welcome to the Jungle, eFinancialCareers, Alternance.fr, sites carrières des grandes banques…)
- **Évalue une offre** depuis un copier-coller d'URL avec affichage temps réel des logs Claude
- **Tracker visuel** des candidatures parsé depuis `data/applications.md`
- **Filtre apprenant** : tu marques les offres que tu rejettes, Claude analyse les patterns et propose des règles à ajouter à `portals.yml`
- **Galerie des PDF générés** avec ouverture native (Finder, Explorer)
- **Bouton « mettre à jour career-ops »** qui exécute `git pull --rebase --autostash + npm install + doctor` en préservant tes fichiers locaux

### Architecture

```
~/.myjobhub/config.json                Configuration globale MyJobHub (liste des profils)

<dossier-utilisateur>/<profil>/        Workspace d'un profil
└── career-ops/                        Clone autonome de career-ops
    ├── cv.md                          Données utilisateur
    ├── config/profile.yml             Données utilisateur
    ├── portals.yml                    Données utilisateur
    ├── data/                          Tracker + feedback MyJobHub
    ├── reports/, output/              Sorties générées
    └── modes/, *.mjs, …               Sources career-ops (jamais modifiées)
```

MyJobHub n'écrit **jamais** dans les fichiers du système career-ops. Chaque profil contient un clone autonome qui peut être mis à jour indépendamment. Tu peux toujours `cd <workspace>/career-ops && claude` pour utiliser career-ops directement, sans passer par l'interface graphique.

### Prérequis

- [Node.js 22 LTS](https://nodejs.org) (un `.nvmrc` est inclus pour `nvm use`)
- [Git](https://git-scm.com)
- [Claude Code CLI](https://claude.com/claude-code) installé et authentifié (`claude --version` doit fonctionner)
- macOS, Windows ou Linux

### Installation

```bash
git clone https://github.com/Rogue06/MyJobHub-Frontend.git
cd MyJobHub-Frontend
nvm use            # active Node 22
npm install
npm run dev
```

L'application est accessible sur [http://localhost:3000](http://localhost:3000).

### Création du premier profil

1. Ouvre [http://localhost:3000](http://localhost:3000)
2. Clique sur « Créer un profil »
3. Donne-lui un nom (ex. *Emploi banque*) et choisis le dossier parent
4. Glisse ton CV PDF (par exemple un export Canva) — l'IA extrait le texte et structure automatiquement `cv.md` et `profile.yml`
5. Relis et corrige si besoin
6. Ajuste tes préférences : type de contrat, domaines, fourchette de rémunération, mobilité géographique
7. Coche les sources d'annonces à surveiller
8. Lance l'installation : MyJobHub clone career-ops, installe les dépendances, configure tout

Compter **2 à 4 minutes** la première fois (git clone + `npm install` + `playwright install`).

### Modules

| Module | Description |
|--------|-------------|
| **Tableau de bord** | Vue d'ensemble du profil actif et accès rapide aux actions |
| **Évaluer une offre** | Colle une URL ou un texte d'annonce, Claude évalue, génère un CV adapté et un rapport |
| **Triage des annonces** | Marque ce que tu gardes ou rejettes ; Claude propose des règles de filtre à appliquer à `portals.yml` |
| **Candidatures** | Tracker visuel de `data/applications.md` avec stats et filtres |
| **Documents** | Galerie des PDFs générés (CV adaptés, lettres de motivation, rapports) |
| **Configuration** | Éditeurs visuels du profil, des préférences, des sources et du CV |
| **Profils** | Gestion multi-profils (création, activation, suppression) |

### Mettre à jour career-ops

Le bouton **« Mettre à jour career-ops »** dans Configuration exécute :

```bash
git pull --rebase --autostash    # préserve tes fichiers locaux
npm install
npm run doctor
```

Si tu utilises ton propre fork plutôt que `santifer/career-ops`, ajoute simplement le remote upstream une fois :

```bash
cd <workspace>/career-ops
git remote add upstream https://github.com/santifer/career-ops.git
git fetch upstream
git merge upstream/main
```

### Stack technique

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS 3 + shadcn/ui (Base UI)
- pdf-parse v2 — extraction de texte des CV
- yaml — lecture/écriture des fichiers YAML
- sonner — notifications
- Server-Sent Events pour le streaming temps réel (git clone, npm install, claude -p)

### Crédits

- **career-ops** : projet open-source MIT de [Santiago Fernández](https://santifer.io) — [github.com/santifer/career-ops](https://github.com/santifer/career-ops). MyJobHub est une couche d'interface autour de career-ops, pas un fork. Tout le moteur d'évaluation, de génération de PDF et de scan vient de career-ops.
- **MyJobHub** : conçu et développé par [Mickaël Burani](https://github.com/Rogue06), avec l'assistance de [Claude Code](https://claude.com/claude-code).

MyJobHub respecte la [Trademark Policy](https://github.com/santifer/career-ops/blob/main/TRADEMARK.md) de career-ops en n'utilisant pas le nom *career-ops* dans son identité de projet.

### Licence

MIT — voir [LICENSE](LICENSE).

---

## English

MyJobHub is a local web application that makes [career-ops](https://github.com/santifer/career-ops) accessible to job seekers without requiring terminal use or manual YAML file editing. A guided wizard imports your PDF resume, configures your profile, generates the files career-ops expects, and lets you evaluate job offers in a single click.

### Why MyJobHub

career-ops is a powerful tool but it's built for users comfortable with the Claude Code CLI and manual config file editing. MyJobHub adds a simple French-language UX layer that:

- **Onboards painlessly**: a 6-step wizard with PDF resume import and automatic AI-driven structuring
- **Hides YAML complexity**: visual editors for `cv.md`, `config/profile.yml`, `portals.yml`
- **Supports multiple profiles** independently side by side (e.g. full-time job search + apprenticeship search)
- **Pre-loads 30+ French job boards** as toggleable sources (France Travail, APEC, Indeed, LinkedIn, HelloWork, Welcome to the Jungle, eFinancialCareers, Alternance.fr, direct career pages of major French banks…)
- **Evaluates an offer** from a copy-pasted URL with real-time Claude log streaming
- **Visual application tracker** parsed from `data/applications.md`
- **Learning filter**: you mark offers you reject, Claude analyzes patterns and proposes rules to add to `portals.yml`
- **Generated-PDFs gallery** with native open (Finder, Explorer)
- **"Update career-ops" button** running `git pull --rebase --autostash + npm install + doctor` while preserving your local files

### Architecture

```
~/.myjobhub/config.json                Global MyJobHub config (list of profiles)

<user-folder>/<profile>/               A profile's workspace
└── career-ops/                        Standalone career-ops clone
    ├── cv.md                          User data
    ├── config/profile.yml             User data
    ├── portals.yml                    User data
    ├── data/                          Tracker + MyJobHub feedback
    ├── reports/, output/              Generated outputs
    └── modes/, *.mjs, …               career-ops sources (never modified)
```

MyJobHub **never** writes inside career-ops's own source files. Each profile contains a standalone clone that can be updated independently. You can always `cd <workspace>/career-ops && claude` to use career-ops directly without the GUI.

### Requirements

- [Node.js 22 LTS](https://nodejs.org) (a `.nvmrc` is included for `nvm use`)
- [Git](https://git-scm.com)
- [Claude Code CLI](https://claude.com/claude-code) installed and authenticated (`claude --version` must work)
- macOS, Windows or Linux

### Install

```bash
git clone https://github.com/Rogue06/MyJobHub-Frontend.git
cd MyJobHub-Frontend
nvm use            # activates Node 22
npm install
npm run dev
```

The app is available at [http://localhost:3000](http://localhost:3000). UI is in French.

### Creating your first profile

1. Open [http://localhost:3000](http://localhost:3000)
2. Click "Créer un profil" (Create a profile)
3. Give it a name and pick a parent folder
4. Drop your PDF resume (e.g. a Canva export) — the AI extracts text and automatically structures both `cv.md` and `profile.yml`
5. Review and correct as needed
6. Tune your preferences: contract type, target domains, salary range, geographic mobility
7. Toggle the job sources you want to watch
8. Run provisioning: MyJobHub clones career-ops, installs dependencies, writes the config

Allow **2–4 minutes** the first time (git clone + `npm install` + `playwright install`).

### Modules

| Module | Description |
|--------|-------------|
| **Dashboard** | Overview of the active profile and quick action shortcuts |
| **Evaluate offer** | Paste a URL or job description, Claude evaluates, generates tailored resume and report |
| **Triage** | Mark offers as Keep/Reject; Claude proposes filter rules to add to `portals.yml` |
| **Applications** | Visual tracker from `data/applications.md` with stats and filters |
| **Documents** | Generated-PDF gallery (tailored resumes, cover letters, reports) |
| **Configuration** | Visual editors for profile, preferences, sources, resume |
| **Profiles** | Multi-profile management (create, activate, delete) |

### Updating career-ops

The **"Mettre à jour career-ops"** (Update career-ops) button in Configuration runs:

```bash
git pull --rebase --autostash    # preserves your local files
npm install
npm run doctor
```

If you use your own fork instead of `santifer/career-ops`, add the upstream remote once:

```bash
cd <workspace>/career-ops
git remote add upstream https://github.com/santifer/career-ops.git
git fetch upstream
git merge upstream/main
```

### Tech stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS 3 + shadcn/ui (Base UI primitives)
- pdf-parse v2 — resume text extraction
- yaml — YAML read/write
- sonner — notifications
- Server-Sent Events for real-time streaming (git clone, npm install, claude -p)

### Credits

- **career-ops**: MIT open-source project by [Santiago Fernández](https://santifer.io) — [github.com/santifer/career-ops](https://github.com/santifer/career-ops). MyJobHub is a UI layer around career-ops, not a fork. The whole evaluation, PDF generation and scanning engine comes from career-ops.
- **MyJobHub**: designed and built by [Mickaël Burani](https://github.com/Rogue06), with assistance from [Claude Code](https://claude.com/claude-code).

MyJobHub complies with career-ops's [Trademark Policy](https://github.com/santifer/career-ops/blob/main/TRADEMARK.md) by not using the *career-ops* name in its project identity.

### License

MIT — see [LICENSE](LICENSE).
