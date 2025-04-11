# Utilisation de l'image Node.js 23-slim comme base
FROM node:23-slim

# Définir la variable HOME pour l'utilisateur non-root
ENV HOME=/home/container

# S'assurer d'être en root pour l'installation des paquets système
USER root

# Mise à jour des paquets et installation des dépendances
RUN apt-get update && \
    apt-get install -y \
      wget ca-certificates fonts-liberation libappindicator3-1 libasound2 \
      libatk-bridge2.0-0 libatk1.0-0 libatspi2.0-0 libcurl4 libdbus-1-3 \
      libexpat1 libfontconfig1 libgbm1 libglib2.0-0 libgtk-3-0 libnspr4 \
      libnss3 libx11-xcb1 libxcomposite1 libxdamage1 libxext6 libxfixes3 \
      libxrandr2 libxss1 libxtst6 xdg-utils build-essential libcairo2-dev \
      libpango1.0-dev libjpeg-dev libgif-dev pkg-config git curl jq file \
      unzip make gcc g++ python3 python3-dev python3-pip libtool \
      --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Installation de ts-node globalement (si nécessaire)
RUN npm install -g ts-node

# Création de l'utilisateur "container" avec son répertoire personnel
RUN useradd -m -d /home/container container

# Définir le répertoire de travail
WORKDIR /home/container

# Copier le script d'entrée dans l'image
COPY ./entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Passer à l'utilisateur non-root "container"
USER container

# Définir la commande d'entrée
CMD ["/bin/bash", "/entrypoint.sh"]
