FROM node:23-slim

# Installer les dépendances système nécessaires (Puppeteer + canvas + tini)
RUN apt-get update && apt-get install -y --no-install-recommends \
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
  tini \
  && rm -rf /var/lib/apt/lists/*

# Créer un utilisateur non-root nommé "container" avec son répertoire personnel
RUN useradd -m -d /home/container container

# Définir des variables d'environnement pour faciliter l'utilisation de l'utilisateur
ENV USER=container
ENV HOME=/home/container

# Définir le répertoire de travail sur le dossier personnel de l'utilisateur
WORKDIR /home/container

# Copier les fichiers package*.json et installer les dépendances Node.js
COPY package*.json ./
RUN npm install

# Copier l'intégralité du projet dans le conteneur
COPY . .

# Pour s'assurer que l'utilisateur "container" possède bien tous les fichiers
RUN chown -R container:container /home/container

# Utiliser Tini comme init pour une meilleure gestion des signaux et des processus zombies
ENTRYPOINT ["/usr/bin/tini", "--"]

# Lancer l'application Node.js
CMD ["node", "index.js"]
