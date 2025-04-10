FROM node:23-slim

# Créer l'utilisateur "container" avec son répertoire home
RUN useradd -m container

# Installer les dépendances système nécessaires (Puppeteer + canvas)
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

# Définir le répertoire de travail dans /home/container, comme requis par Pterodactyl
WORKDIR /home/container

# Copier les fichiers package.json et package-lock.json (ou yarn.lock) dans le répertoire de travail
COPY package*.json ./

# Installer les dépendances Node.js
RUN npm install

# Copier l'intégralité du projet dans /home/container
COPY . .

# Assurer que l'utilisateur "container" possède bien tous les fichiers
RUN chown -R container:container /home/container

# Passer à l'utilisateur non-root "container"
USER container

# Lancer l'application
CMD ["node", "index.js"]
