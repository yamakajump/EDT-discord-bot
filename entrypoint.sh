#!/bin/bash
set -e

# Mettre à jour le dépôt si le dossier .git existe
if [[ -d .git ]]; then 
    git pull --recurse-submodules;
fi;

# Installer des paquets Node.js additionnels si la variable NODE_PACKAGES est définie
if [[ ! -z ${NODE_PACKAGES} ]]; then 
    npm install ${NODE_PACKAGES};
fi;

# Installer les dépendances de production si package.json est présent dans /home/container
if [ -f /home/container/package.json ]; then 
    npm install --production;
fi;

# Lancer l'application
node /home/container/index.js
