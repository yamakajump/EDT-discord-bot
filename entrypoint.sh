#!/bin/bash
set -e

# Si package-lock.json existe, on peut utiliser npm ci pour une installation propre,
# sinon, on utilise npm install.
if [ -f /home/container/package-lock.json ]; then
  npm ci --production
else
  npm install --production
fi

# Préparation de la commande de démarrage en substituant les variables.
# On utilise des quotes pour éviter que le shell n'interprète trop tôt certains caractères.
MODIFIED_STARTUP=$(eval echo "$(echo ${STARTUP} | sed -e 's/{{/${/g' -e 's/}}/}/g')")
echo "Starting bot with command: ${MODIFIED_STARTUP}"

# Exécution de la commande de démarrage
eval "${MODIFIED_STARTUP}"
