#!/usr/bin/env bash
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

cat > "$COMMAND_FILE" << EOF
#!/usr/bin/env bash
# Raccourci MyJobHub — généré par install-mac.sh
# Ferme cette fenêtre Terminal pour arrêter MyJobHub.

set -e
cd "$REPO_DIR"

if [ -s "\$HOME/.nvm/nvm.sh" ]; then
  # shellcheck disable=SC1090
  source "\$HOME/.nvm/nvm.sh"
  nvm use 22.5.1 >/dev/null 2>&1 || true
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
