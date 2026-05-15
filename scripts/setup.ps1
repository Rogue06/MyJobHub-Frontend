# setup.ps1 — Installation complète et automatisée de MyJobHub (Windows)
# Usage : ouvre PowerShell dans le dossier du projet et lance :
#   .\scripts\setup.ps1
#
# Si tu obtiens une erreur de "Execution Policy", lance d'abord :
#   Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned

$ErrorActionPreference = "Stop"

function Write-Step($msg) { Write-Host "`n▶ $msg" -ForegroundColor Blue }
function Write-Ok($msg)   { Write-Host "✓ $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "⚠ $msg" -ForegroundColor Yellow }
function Write-Fail($msg) { Write-Host "✗ $msg" -ForegroundColor Red; exit 1 }

$RepoDir = (Resolve-Path "$PSScriptRoot\..").Path
Set-Location $RepoDir

Write-Host "MyJobHub — installation" -ForegroundColor Cyan
Write-Host "Plateforme    : Windows"
Write-Host "Dossier projet: $RepoDir"

# ============================================================================
# Étape 1 — Node.js
# ============================================================================

Write-Step "1/4 — Vérification de Node.js"

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Fail "Node.js n'est pas installé.`n  Télécharge-le depuis https://nodejs.org (version 22 LTS recommandée),`n  puis relance ce script."
}

$NodeVersion = (node -v)
$NodeMajor = [int]($NodeVersion -replace '^v(\d+).*', '$1')

if ($NodeMajor -lt 18) {
  Write-Fail "Node $NodeVersion détecté, mais MyJobHub a besoin de Node 18 ou plus récent (22 recommandé)."
}

Write-Ok "Node $NodeVersion"

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  Write-Fail "npm n'est pas trouvé. Ré-installe Node.js depuis https://nodejs.org"
}

# ============================================================================
# Étape 2 — Claude Code CLI
# ============================================================================

Write-Step "2/4 — Vérification de Claude Code CLI"

if (Get-Command claude -ErrorAction SilentlyContinue) {
  $ClaudeVersion = (claude --version 2>&1 | Select-Object -First 1)
  Write-Ok "Claude Code CLI trouvé ($ClaudeVersion)"
} else {
  Write-Warn "Claude Code CLI introuvable."
  Write-Warn "Tu pourras quand même lancer MyJobHub, mais les actions IA ne marcheront pas."
  Write-Warn "Installe-le depuis https://claude.com/claude-code et reviens."
}

# ============================================================================
# Étape 3 — npm install
# ============================================================================

Write-Step "3/4 — Installation des dépendances npm (peut prendre 1-2 min)"

if (Test-Path "node_modules") {
  Write-Host "  node_modules présent, mise à jour…"
}

npm install --silent
if ($LASTEXITCODE -ne 0) { Write-Fail "npm install a échoué." }
Write-Ok "Dépendances installées"

# ============================================================================
# Étape 4 — Raccourci sur le Bureau
# ============================================================================

Write-Step "4/4 — Raccourci de lancement"

$DesktopDir = [Environment]::GetFolderPath("Desktop")
$BatFile = Join-Path $DesktopDir "MyJobHub.bat"

$BatContent = @"
@echo off
title MyJobHub
cd /d "$RepoDir"

echo Demarrage de MyJobHub...
echo Le navigateur va s'ouvrir sur http://localhost:3000 dans 4 secondes.
echo Garde cette fenetre ouverte. Pour arreter, ferme-la ou fais Ctrl+C.
echo.

start "" "timeout /t 4 /nobreak >nul & start http://localhost:3000"

call npm run dev

pause
"@

# Approche plus robuste : utiliser PowerShell.exe pour ouvrir le navigateur en différé
$BatContent = @"
@echo off
title MyJobHub
cd /d "$RepoDir"

echo Demarrage de MyJobHub...
echo Le navigateur va s'ouvrir sur http://localhost:3000 dans 4 secondes.
echo Garde cette fenetre ouverte. Pour arreter, ferme-la ou fais Ctrl+C.
echo.

start "" powershell -NoProfile -Command "Start-Sleep -Seconds 4; Start-Process 'http://localhost:3000'"

call npm run dev

pause
"@

Set-Content -Path $BatFile -Value $BatContent -Encoding ASCII
Write-Ok "Raccourci créé : $BatFile"
Write-Host "  Double-clique dessus pour lancer MyJobHub."

# ============================================================================
# Récap
# ============================================================================

Write-Host ""
Write-Host "Installation terminée 🎉" -ForegroundColor Green
Write-Host ""
Write-Host "Pour lancer MyJobHub :"
Write-Host "  • Double-clic sur MyJobHub.bat (sur ton Bureau)"
Write-Host "  • OU dans PowerShell : cd $RepoDir ; npm run dev"
Write-Host ""
Write-Host "Documentation complète : voir README.md"
