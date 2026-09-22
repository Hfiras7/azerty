#!/bin/sh
# EPOS — Initiation au Drug Design
# Équivalent de « Lancer le jeu.bat » pour macOS et Linux.
cd "$(dirname "$0")" || exit 1
(command -v xdg-open >/dev/null 2>&1 && xdg-open index.html) \
  || (command -v open >/dev/null 2>&1 && open index.html) \
  || echo "Ouvrez index.html dans votre navigateur."
