#!/bin/bash
set -e

# Définir explicitement le cache npm
export npm_config_cache=/home/container/.npm

# Si package-lock.json existe, utilisation de 'npm ci', sinon 'npm install'
if [ -f /home/container/package-lock.json ]; then
  npm ci --production
else
  npm install --production
fi

# Préparation de la commande de démarrage en substituant les variables
MODIFIED_STARTUP=$(eval echo "$(echo ${STARTUP} | sed -e 's/{{/${/g' -e 's/}}/}/g')")
echo "Starting bot with command: ${MODIFIED_STARTUP}"

# Exécution de la commande de démarrage
eval "${MODIFIED_STARTUP}"
