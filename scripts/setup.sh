#!/bin/bash
# setup.sh — Installation complète et automatisée de MyJobHub
# Usage : ./scripts/setup.sh
# Supporte macOS, Linux, WSL.

set -e

# ============================================================================
# Couleurs (pour les terminaux qui les supportent)
# ============================================================================

if [ -t 1 ]; then
  C_GREEN='\033[0;32m'
  C_BLUE='\033[0;34m'
  C_YELLOW='\033[1;33m'
  C_RED='\033[0;31m'
  C_BOLD='\033[1m'
  C_RESET='\033[0m'
else
  C_GREEN=''; C_BLUE=''; C_YELLOW=''; C_RED=''; C_BOLD=''; C_RESET=''
fi

step() { echo -e "\n${C_BLUE}▶ $1${C_RESET}"; }
ok() { echo -e "${C_GREEN}✓ $1${C_RESET}"; }
warn() { echo -e "${C_YELLOW}⚠ $1${C_RESET}"; }
fail() { echo -e "${C_RED}✗ $1${C_RESET}" >&2; exit 1; }

# ============================================================================
# Détection de plateforme
# ============================================================================

UNAME="$(uname)"
case "$UNAME" in
  Darwin) PLATFORM="mac" ;;
  Linux) [ -n "${WSL_DISTRO_NAME:-}" ] && PLATFORM="wsl" || PLATFORM="linux" ;;
  *) PLATFORM="unknown" ;;
esac

REPO_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
cd "$REPO_DIR"

echo -e "${C_BOLD}MyJobHub — installation${C_RESET}"
echo "Plateforme détectée : $PLATFORM"
echo "Dossier projet      : $REPO_DIR"

# ============================================================================
# Étape 1 — Vérifier Node.js
# ============================================================================

step "1/4 — Vérification de Node.js"

# Charger nvm si présent
if [ -s "$HOME/.nvm/nvm.sh" ]; then
  # shellcheck disable=SC1090
  source "$HOME/.nvm/nvm.sh"
  if [ -f .nvmrc ]; then
    nvm use >/dev/null 2>&1 || nvm install
  fi
fi

if ! command -v node >/dev/null 2>&1; then
  fail "Node.js n'est pas installé.\n  Installe-le depuis https://nodejs.org (version 22 LTS recommandée),\n  ou via nvm : https://github.com/nvm-sh/nvm"
fi

NODE_VERSION="$(node -v)"
NODE_MAJOR="$(echo "$NODE_VERSION" | sed -E 's/^v?([0-9]+).*/\1/')"

if [ "$NODE_MAJOR" -lt 18 ]; then
  fail "Node $NODE_VERSION détecté, mais MyJobHub a besoin de Node 18 ou plus récent (22 recommandé).\n  Si tu as nvm : nvm install 22 && nvm use 22"
fi

ok "Node $NODE_VERSION"

if ! command -v npm >/dev/null 2>&1; then
  fail "npm n'est pas trouvé alors que Node l'est. Ré-installe Node.js depuis https://nodejs.org"
fi

# ============================================================================
# Étape 2 — Claude Code CLI (avertissement seulement, pas bloquant)
# ============================================================================

step "2/4 — Vérification de Claude Code CLI"

if command -v claude >/dev/null 2>&1; then
  ok "Claude Code CLI trouvé ($(claude --version 2>&1 | head -1))"
else
  warn "Claude Code CLI introuvable."
  warn "Tu pourras quand même lancer MyJobHub, mais les actions IA (scan, évaluation, génération PDF…) ne marcheront pas."
  warn "Installe-le depuis https://claude.com/claude-code et reviens."
fi

# ============================================================================
# Étape 3 — npm install
# ============================================================================

step "3/4 — Installation des dépendances npm (peut prendre 1-2 min)"

if [ -d node_modules ]; then
  echo "  node_modules présent, mise à jour…"
fi

npm install --silent
ok "Dépendances installées"

# ============================================================================
# Étape 4 — Raccourci de lancement
# ============================================================================

step "4/4 — Raccourci de lancement"

case "$PLATFORM" in
  mac)
    DESKTOP_DIR="$HOME/Desktop"
    COMMAND_FILE="$DESKTOP_DIR/MyJobHub.command"
    cat > "$COMMAND_FILE" << EOF
#!/bin/bash
# Raccourci MyJobHub — généré par scripts/setup.sh
# Ferme cette fenêtre Terminal pour arrêter MyJobHub.

set -e

# PATH explicite : on évite les bashs/nodes MacPorts non compatibles arm64.
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:\$PATH"

cd "$REPO_DIR"

if [ -s "\$HOME/.nvm/nvm.sh" ]; then
  # shellcheck disable=SC1090
  source "\$HOME/.nvm/nvm.sh"
  nvm use >/dev/null 2>&1 || true
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "❌ npm introuvable. Installe Node.js sur https://nodejs.org"
  read -r -p "Appuie sur Entrée pour fermer..."
  exit 1
fi

echo "🚀 Démarrage de MyJobHub..."
echo "Le navigateur s'ouvre sur http://localhost:3000 dans 4 secondes."
echo "Garde cette fenêtre ouverte. Pour arrêter, ferme-la ou fais Ctrl+C."
echo ""

(sleep 4 && open "http://localhost:3000") &

exec npm run dev
EOF
    chmod +x "$COMMAND_FILE"
    ok "Raccourci créé : $COMMAND_FILE"
    echo "  Double-clique dessus pour lancer MyJobHub."
    ;;
  linux | wsl)
    DESKTOP_DIR="$HOME/Desktop"
    [ -d "$DESKTOP_DIR" ] || DESKTOP_DIR="$HOME"
    LAUNCHER="$DESKTOP_DIR/myjobhub.sh"
    cat > "$LAUNCHER" << EOF
#!/bin/bash
cd "$REPO_DIR"
if [ -s "\$HOME/.nvm/nvm.sh" ]; then
  source "\$HOME/.nvm/nvm.sh"
  nvm use >/dev/null 2>&1 || true
fi
xdg-open "http://localhost:3000" 2>/dev/null &
exec npm run dev
EOF
    chmod +x "$LAUNCHER"
    ok "Launcher script : $LAUNCHER"
    ;;
  *)
    warn "Plateforme non reconnue, pas de raccourci créé."
    echo "  Pour lancer manuellement : cd $REPO_DIR && npm run dev"
    ;;
esac

# ============================================================================
# Alias shell optionnel
# ============================================================================

if [ "$PLATFORM" = "mac" ] || [ "$PLATFORM" = "linux" ] || [ "$PLATFORM" = "wsl" ]; then
  RC_FILE=""
  [ -f "$HOME/.zshrc" ] && RC_FILE="$HOME/.zshrc"
  [ -z "$RC_FILE" ] && [ -f "$HOME/.bashrc" ] && RC_FILE="$HOME/.bashrc"

  if [ -n "$RC_FILE" ]; then
    if grep -qF "alias myjobhub=" "$RC_FILE" 2>/dev/null; then
      echo "  Alias 'myjobhub' déjà présent dans $RC_FILE."
    else
      echo ""
      read -r -p "Ajouter un alias 'myjobhub' à $(basename "$RC_FILE") ? [y/N] " ALIAS_ANSWER
      if [[ "$ALIAS_ANSWER" =~ ^[Yy]$ ]]; then
        printf "\n# Ajouté par MyJobHub setup.sh\nalias myjobhub='cd \"%s\" && npm run dev'\n" "$REPO_DIR" >> "$RC_FILE"
        ok "Alias ajouté à $RC_FILE"
        echo "  Recharge ton shell : source $RC_FILE"
        echo "  Puis tape : myjobhub"
      fi
    fi
  fi
fi

# ============================================================================
# Récap
# ============================================================================

echo ""
echo -e "${C_BOLD}${C_GREEN}Installation terminée 🎉${C_RESET}"
echo ""
echo "Pour lancer MyJobHub :"
case "$PLATFORM" in
  mac) echo "  • Double-clic sur MyJobHub.command (sur ton Bureau)" ;;
  linux|wsl) echo "  • ./myjobhub.sh (sur ton Bureau)" ;;
esac
echo "  • OU dans un terminal : cd $REPO_DIR && npm run dev"
echo "  • OU si tu as activé l'alias : myjobhub"
echo ""
echo "Documentation complète : voir README.md"
