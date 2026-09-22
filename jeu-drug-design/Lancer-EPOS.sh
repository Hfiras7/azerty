#!/bin/sh
# EPOS — Initiation au Drug Design
# Équivalent de Lancer-EPOS.bat pour macOS et Linux.
cd "$(dirname "$0")" || exit 1

if ! command -v python3 >/dev/null 2>&1; then
  echo "Python 3 est introuvable sur ce poste." >&2
  exit 1
fi

python3 tools/serveur-resultats.py &
SERVICE=$!
python3 -m http.server 8778 --bind 127.0.0.1 >/dev/null 2>&1 &
JEU=$!
trap 'kill "$SERVICE" "$JEU" 2>/dev/null' INT TERM EXIT

sleep 2
(command -v xdg-open >/dev/null 2>&1 && xdg-open http://127.0.0.1:8778/index.html) \
  || (command -v open >/dev/null 2>&1 && open http://127.0.0.1:8778/index.html) \
  || echo "Ouvrez http://127.0.0.1:8778/index.html dans votre navigateur."

echo "Jeu démarré. Ctrl+C pour arrêter."
wait "$JEU"
