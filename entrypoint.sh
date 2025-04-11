#!/bin/bash

# Activation de corepack afin d'utiliser Yarn si besoin
corepack enable

# Installation des dépendances Node.js en mode production
yarn install --check-cache --production

# Préparation de la commande de démarrage en substituant les variables (exemple)
MODIFIED_STARTUP=$(eval echo $(echo ${STARTUP} | sed -e 's/{{/${/g' -e 's/}}/}/g'))
echo "Starting bot with command: ${MODIFIED_STARTUP}"

# Exécution de la commande de démarrage
${MODIFIED_STARTUP}
