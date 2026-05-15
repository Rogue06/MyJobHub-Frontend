# MyJobHub

> Interface graphique pour [`santifer/career-ops`](https://github.com/santifer/career-ops) — recherche d'emploi assistée par IA, sans terminal ni édition YAML.
>
> A graphical interface for [`santifer/career-ops`](https://github.com/santifer/career-ops) — AI-assisted job hunting, no terminal, no YAML editing.

[🇫🇷 Français](#français) · [🇬🇧 English](#english)

---

> ⚠️ **MyJobHub is not affiliated with, endorsed by, or sponsored by career-ops or its author.** It's an independent UI built on top of the open-source [career-ops](https://github.com/santifer/career-ops) by [@santifer](https://santifer.io). All credit for the actual job-search engine (evaluation, PDF, scan, pipeline) goes to him. See [ACKNOWLEDGMENTS](ACKNOWLEDGMENTS.md).

---

## Français

MyJobHub est une application web locale qui rend [career-ops](https://github.com/santifer/career-ops) accessible à toute personne en recherche d'emploi, sans avoir à manipuler de fichiers YAML ni à mémoriser de slash commands. Tu importes ton CV PDF, MyJobHub configure tout, et tu lances l'évaluation IA de toutes tes offres en un clic.

> **À propos de career-ops** — Tout le moteur (évaluation A-F, génération de CV PDF, scan des portails, pipeline d'évaluation, analyse de patterns) vient de [career-ops](https://github.com/santifer/career-ops), un projet open-source MIT créé par [Santiago Fernández](https://santifer.io). MyJobHub n'est que la couche d'interface graphique au-dessus.

### Installation rapide (macOS, Linux, WSL)

```bash
git clone https://github.com/Rogue06/MyJobHub-Frontend.git
cd MyJobHub-Frontend
./scripts/setup.sh
```

C'est tout. Le script :
1. Vérifie que Node 18+ et Claude Code CLI sont installés (donne le lien d'install sinon)
2. Lance `npm install` (1-2 min)
3. **Sur macOS** : crée un fichier `MyJobHub.command` sur ton Bureau (double-clic = MyJobHub démarre + navigateur s'ouvre)
4. **Sur Linux/WSL** : crée un `myjobhub.sh` sur ton Bureau
5. Te propose d'ajouter un alias shell `myjobhub` (optionnel)

Une fois installé, **double-clic sur le raccourci du Bureau** = MyJobHub tourne sur [http://localhost:3000](http://localhost:3000).

### Prérequis

- [Node.js 18 ou plus récent](https://nodejs.org) — 22 LTS recommandé. Un `.nvmrc` est inclus pour `nvm use`.
- [Git](https://git-scm.com)
- [Claude Code CLI](https://claude.com/claude-code) installé et authentifié (`claude --version` doit fonctionner). C'est lui qui exécute les commandes career-ops.

### Premier profil

1. Lance MyJobHub (double-clic sur le raccourci du Bureau)
2. Clique sur « Créer un profil » dans le tableau de bord
3. Donne-lui un nom (ex. *Emploi banque*) et choisis le dossier parent
4. Glisse ton CV PDF — l'IA extrait le texte et structure automatiquement `cv.md` et `profile.yml`
5. Ajuste tes préférences (contrat, domaines, salaire, mobilité) et tes sources d'annonces
6. Lance l'installation : MyJobHub clone career-ops, installe les dépendances et configure tout

Compter **2 à 4 minutes** la première fois (clone + `npm install` + `playwright install`).

**Tu as déjà des dossiers career-ops configurés ?** Va dans **Profils → Importer un profil existant**. MyJobHub détecte automatiquement la structure et n'écrit rien dans tes dossiers à l'import.

### Workflow type

1. **Matin** : double-clic sur le raccourci du Bureau pour lancer MyJobHub
2. Va dans **Triage des annonces → Inbox**
3. Clique sur **🪄 Tout automatiser** (1 seul bouton)
4. Pause café — Claude scanne tous tes portails, évalue chaque nouvelle offre, génère un CV adapté + une lettre + un rapport pour chacune
5. 20-30 min plus tard, va dans **Candidatures** → tu vois la liste avec scores, tu choisis où postuler
6. Pour les offres derrière login (LinkedIn principalement), va dans **Recherches en direct** → tes recherches pré-remplies s'ouvrent dans ton navigateur où tu es déjà connecté

### Modules

| Module | Description |
|--------|-------------|
| **Tableau de bord** | Vue d'ensemble + prochaines actions recommandées + statistiques |
| **Évaluer une offre** | Colle une URL ou un texte d'annonce, Claude évalue, génère CV adapté + rapport |
| **Recherches en direct** | URLs de recherche pré-remplies avec tes critères sur chaque site (utile pour LinkedIn) |
| **Triage des annonces** | Inbox + filtre apprenant (l'IA apprend de tes rejets et propose des règles à `portals.yml`) |
| **Candidatures** | Tracker visuel de `data/applications.md` avec stats et filtres |
| **Documents** | Galerie des PDF générés (CV adaptés, lettres, rapports) |
| **Actions** | Toutes les commandes career-ops regroupées par usage métier (15 commandes) |
| **Configuration** | Éditeurs visuels du profil, des préférences, des sources et du CV |
| **Profils** | Gestion multi-profils (créer, importer, activer, supprimer) |

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

Chaque profil contient un **clone autonome et non modifié** de career-ops. MyJobHub n'écrit jamais dans les fichiers du système career-ops — uniquement dans les fichiers user-data (`cv.md`, `config/profile.yml`, `portals.yml`, `data/*`). Tu peux à tout moment `cd <workspace>/career-ops && claude` pour utiliser career-ops directement sans passer par l'interface.

### Mettre à jour career-ops

Dans **Configuration**, le bouton **Mettre à jour career-ops** exécute :

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

### Stack technique

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS 4 + shadcn/ui (sur Base UI)
- pdf-parse v2 — extraction de texte des CV
- yaml — lecture/écriture des fichiers YAML
- sonner — notifications
- Server-Sent Events pour le streaming temps réel (git clone, npm install, claude -p)

### Dépannage

**Le double-clic sur `MyJobHub.command` plante avec une erreur libncurses / mach-o / architecture** : tu as MacPorts ou autre install x86_64 qui shadow le bash système sur ton Apple Silicon. Relance `./scripts/setup.sh` qui régénère le `.command` avec `/bin/bash` hard-codé et un PATH explicite.

**`claude --version` ne fonctionne pas** : installe [Claude Code](https://claude.com/claude-code) et connecte-toi (`claude /login` au premier lancement).

**Le port 3000 est déjà pris** : ferme l'autre processus, ou modifie `npm run dev` en `npm run dev -- -p 3001`.

**Le scan IA est très lent ou ne trouve rien** : choisis « Scan rapide » d'abord (Greenhouse/Ashby/Lever, gratuit, instantané). Pour les portails FR (France Travail, APEC…), utilise « Scan complet » qui passe par Playwright + WebSearch — compte 5-10 min.

### Crédits

- **career-ops** : projet open-source MIT créé par [Santiago Fernández](https://santifer.io) — [github.com/santifer/career-ops](https://github.com/santifer/career-ops). Sans ce projet, MyJobHub n'existerait pas. Tout le moteur (évaluation, PDF, scan, pipeline) vient de career-ops. Voir [ACKNOWLEDGMENTS.md](ACKNOWLEDGMENTS.md) pour les détails.
- **MyJobHub** : conçu et développé par [Mickaël Burani](https://github.com/Rogue06), avec l'assistance de [Claude Code](https://claude.com/claude-code).

MyJobHub respecte la [Trademark Policy](https://github.com/santifer/career-ops/blob/main/TRADEMARK.md) de career-ops : nom distinct, pas de prétention d'affiliation officielle, attribution explicite.

### Licence

MIT — voir [LICENSE](LICENSE).

---

## English

MyJobHub is a local web application that makes [career-ops](https://github.com/santifer/career-ops) accessible to job seekers without requiring terminal use or manual YAML editing. You import your PDF resume, MyJobHub configures everything, and you launch the AI evaluation of all your offers in a single click.

> **About career-ops** — The entire engine (A-F evaluation, ATS-optimized PDF generation, portal scanning, pipeline, pattern analysis) comes from [career-ops](https://github.com/santifer/career-ops), an MIT open-source project by [Santiago Fernández](https://santifer.io). MyJobHub is only the graphical UI layer on top.

### Quick install (macOS, Linux, WSL)

```bash
git clone https://github.com/Rogue06/MyJobHub-Frontend.git
cd MyJobHub-Frontend
./scripts/setup.sh
```

That's it. The script:
1. Checks Node 18+ and Claude Code CLI are installed (gives install link otherwise)
2. Runs `npm install` (1-2 min)
3. **On macOS**: creates a `MyJobHub.command` shortcut on your Desktop (double-click = MyJobHub starts + browser opens)
4. **On Linux/WSL**: creates a `myjobhub.sh` on your Desktop
5. Offers to add a shell alias `myjobhub` (optional)

After install, **double-click the Desktop shortcut** → MyJobHub runs at [http://localhost:3000](http://localhost:3000). UI is in French.

### Requirements

- [Node.js 18 or newer](https://nodejs.org) — 22 LTS recommended. A `.nvmrc` is included.
- [Git](https://git-scm.com)
- [Claude Code CLI](https://claude.com/claude-code) installed and authenticated (`claude --version` must work). It runs the actual career-ops commands.

### Modules

| Module | Description |
|--------|-------------|
| **Dashboard** | Overview + recommended next actions + stats |
| **Evaluate offer** | Paste URL / JD, Claude evaluates, generates tailored resume + report |
| **Live searches** | Search URLs pre-filled with your criteria on each site (useful for LinkedIn) |
| **Triage** | Inbox + learning filter (the AI learns from your rejections and proposes `portals.yml` rules) |
| **Applications** | Visual tracker from `data/applications.md` |
| **Documents** | Generated-PDF gallery |
| **Actions** | All career-ops commands grouped by use case (15 commands) |
| **Configuration** | Visual editors for profile, preferences, sources, resume |
| **Profiles** | Multi-profile management (create, import, activate, delete) |

### Credits

- **career-ops**: MIT open-source project by [Santiago Fernández](https://santifer.io) — [github.com/santifer/career-ops](https://github.com/santifer/career-ops). Without it, MyJobHub couldn't exist. The whole engine (evaluation, PDF, scan, pipeline) comes from career-ops. See [ACKNOWLEDGMENTS.md](ACKNOWLEDGMENTS.md).
- **MyJobHub**: designed and built by [Mickaël Burani](https://github.com/Rogue06), with extensive use of [Claude Code](https://claude.com/claude-code).

MyJobHub complies with career-ops's [Trademark Policy](https://github.com/santifer/career-ops/blob/main/TRADEMARK.md): distinct name, no claim of official affiliation, explicit attribution.

### License

MIT — see [LICENSE](LICENSE).
