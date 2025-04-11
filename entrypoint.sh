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

# Traitement de la commande STARTUP
STARTUP_PROCESSED=$(echo "${STARTUP}" | sed -e 's/{{/${/g' -e 's/}}/}/g')
echo "Starting bot with command: ${STARTUP_PROCESSED}"
eval "${STARTUP_PROCESSED}"
