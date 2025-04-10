FROM node:23-slim

# Création de l'utilisateur "container" avec son répertoire personnel (/home/container)
RUN useradd -m container

# Installer les dépendances système nécessaires pour Puppeteer, canvas et l'installation via l'egg
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
  git \
  curl \
  jq \
  file \
  unzip \
  make \
  gcc \
  g++ \
  python3 \
  python3-dev \
  python3-pip \
  libtool \
  --no-install-recommends && rm -rf /var/lib/apt/lists/*

# Installer globalement ts-node pour supporter l'exécution de fichiers TypeScript
RUN npm install -g ts-node

# Définir le répertoire de travail dans /home/container (répertoire attendu par Pterodactyl)
WORKDIR /home/container

# Copier les fichiers package.json (ainsi que package-lock.json ou yarn.lock si présent)
COPY package*.json ./

# Installer les dépendances Node.js définies dans package.json
RUN npm install

# Copier l'intégralité du projet dans /home/container
COPY . .

# S'assurer que l'utilisateur "container" possède tous les fichiers
RUN chown -R container:container /home/container

# Se positionner sous l'utilisateur non-root "container"
USER container

# Le panel Pterodactyl va injecter les variables d'environnement et le script de démarrage (startup) défini dans l'egg.
# Afin de ne pas interférer avec ce comportement, nous définissons l'entrypoint par défaut sur bash.
CMD ["bash"]