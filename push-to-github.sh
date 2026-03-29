#!/bin/bash
# ─── Labyrint Hero – Push til GitHub ─────────────────────────────────────────
# Kjør dette skriptet etter at du har opprettet et tomt repo på GitHub.
# Bruk: bash push-to-github.sh <github-brukernavn> <repo-navn>
# Eksempel: bash push-to-github.sh gunstein labyrint-hero

set -e

USER=${1:-"gunstein"}
REPO=${2:-"labyrint-hero"}
REMOTE="https://github.com/${USER}/${REPO}.git"

GIT="git --git-dir=$(dirname "$0")/../../../labyrint-git --work-tree=$(dirname "$0")"

echo "→ Legger til remote: $REMOTE"
$GIT remote add origin "$REMOTE" 2>/dev/null || $GIT remote set-url origin "$REMOTE"

echo "→ Pusher til GitHub (du vil bli bedt om brukernavn + token)..."
$GIT push -u origin main

echo ""
echo "✓ Ferdig! Prosjektet ligger nå på: https://github.com/${USER}/${REPO}"
