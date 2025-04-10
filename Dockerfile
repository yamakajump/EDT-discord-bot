FROM node:23-slim

# Installer les dépendances système (comme Puppeteer, canvas, etc.)
RUN apt-get update && apt-get install -y \
  wget \
  ca-certificates \
  fonts-liberation \
  libappindicator3-1 \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libatspi2.0-0 \
  libcurl4 \
  libdbus-1-3 \
  libexpat1 \
  libfontconfig1 \
  libgbm1 \
  libglib2.0-0 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libx11-xcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxrandr2 \
  libxss1 \
  libxtst6 \
  xdg-utils \
  build-essential \
  libcairo2-dev \
  libpango1.0-dev \
  libjpeg-dev \
  libgif-dev \
  pkg-config \
  --no-install-recommends && rm -rf /var/lib/apt/lists/*

# Créer l’utilisateur "container" et définir le répertoire de travail dans /home/container
RUN useradd -m -d /home/container container
WORKDIR /home/container

# Copier les fichiers package.json et installer les dépendances Node.js
COPY package*.json ./
RUN npm install

# Copier l'intégralité du projet dans /home/container
COPY . .

# Copier le script d'entrypoint personnalisé
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Déclarer la variable d'environnement NODE_PACKAGES avec une valeur par défaut vide
ENV NODE_PACKAGES=""

# Installer tini et le définir comme entrypoint pour une meilleure gestion du signal
RUN apt-get update && apt-get install -y tini && rm -rf /var/lib/apt/lists/*
ENTRYPOINT ["/usr/bin/tini", "--"]

# Pour des raisons de sécurité, exécuter le conteneur avec l'utilisateur "container"
USER container

# Utiliser le script d'entrypoint pour démarrer le conteneur
CMD ["/entrypoint.sh"]
