#!/bin/bash
# install-mac.sh — Installe un raccourci .command sur le Bureau pour
# lancer MyJobHub en double-cliquant (macOS uniquement).

set -e

if [[ "$(uname)" != "Darwin" ]]; then
  echo "Ce script est destiné à macOS. Sur Linux/Windows, voir le README."
  exit 1
fi

REPO_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
DESKTOP_DIR="$HOME/Desktop"
COMMAND_FILE="$DESKTOP_DIR/MyJobHub.command"

# Le shebang `#!/bin/bash` est volontairement hard-codé pour éviter que
# `/usr/bin/env bash` ne sélectionne un bash MacPorts non compatible
# avec les Macs Apple Silicon (arm64). `/bin/bash` est toujours présent
# sur macOS et compatible avec toutes les architectures.

cat > "$COMMAND_FILE" << EOF
#!/bin/bash
# Raccourci MyJobHub — généré par install-mac.sh
# Ferme cette fenêtre Terminal pour arrêter MyJobHub.

set -e

# PATH explicite (priorité Homebrew Apple Silicon, puis Intel, puis système)
# pour éviter d'utiliser un bash/node MacPorts incompatible.
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:\$PATH"

cd "$REPO_DIR"

# Active la bonne version de Node via nvm si disponible.
if [ -s "\$HOME/.nvm/nvm.sh" ]; then
  # shellcheck disable=SC1090
  source "\$HOME/.nvm/nvm.sh"
  nvm use 22.5.1 >/dev/null 2>&1 || true
fi

if ! command -v npm >/dev/null 2>&1; then
  echo ""
  echo "❌ npm n'a pas été trouvé."
  echo "   Installe Node.js (https://nodejs.org) ou nvm, puis relance ce raccourci."
  echo ""
  read -r -p "Appuie sur Entrée pour fermer..."
  exit 1
fi

echo "🚀 Démarrage de MyJobHub..."
echo "Le navigateur va s'ouvrir sur http://localhost:3000 dans 4 secondes."
echo "Garde cette fenêtre ouverte. Pour arrêter, ferme-la ou fais Ctrl+C."
echo ""

(sleep 4 && open "http://localhost:3000") &

exec npm run dev
EOF

chmod +x "$COMMAND_FILE"

echo ""
echo "✓ Raccourci créé : $COMMAND_FILE"
echo ""
echo "  Double-clique dessus pour lancer MyJobHub."
echo "  Le navigateur s'ouvrira automatiquement sur http://localhost:3000."
echo "  Pour arrêter, ferme la fenêtre Terminal qui s'ouvre, ou fais Ctrl+C."
echo ""

read -r -p "Veux-tu aussi ajouter un alias 'myjobhub' au shell (zsh) ? [y/N] " ALIAS_ANSWER
if [[ "$ALIAS_ANSWER" =~ ^[Yy]$ ]]; then
  RC_FILE="$HOME/.zshrc"
  ALIAS_LINE="alias myjobhub='cd \"$REPO_DIR\" && npm run dev'"
  if grep -qF "alias myjobhub=" "$RC_FILE" 2>/dev/null; then
    echo "ℹ Un alias 'myjobhub' existe déjà dans $RC_FILE — non modifié."
  else
    echo "" >> "$RC_FILE"
    echo "# Ajouté par MyJobHub install-mac.sh" >> "$RC_FILE"
    echo "$ALIAS_LINE" >> "$RC_FILE"
    echo "✓ Alias ajouté à $RC_FILE. Recharge ton shell avec : source $RC_FILE"
    echo "  Puis tape simplement 'myjobhub' depuis n'importe quel terminal."
  fi
fi

echo ""
echo "Installation terminée."
