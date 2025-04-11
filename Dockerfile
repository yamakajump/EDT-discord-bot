# Utilisation de l'image Node.js 20 spécifiée par l'egg Pterodactyl
FROM ghcr.io/parkervcp/yolks:nodejs_20

# Mise à jour des paquets et installation des dépendances nécessaires pour Puppeteer et Canvas
RUN apt-get update && \
    apt-get install -y \
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
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Installation de ts-node globalement pour supporter l'exécution de fichiers TypeScript
RUN npm install -g ts-node

# Création de l'utilisateur "container" avec son répertoire personnel
RUN useradd -m -d /home/container container

# Définition du répertoire de travail
WORKDIR /home/container

# Changement de l'utilisateur pour "container"
USER container

# Commande par défaut pour exécuter le script de démarrage défini par l'egg Pterodactyl
CMD ["bash", "-c", "if [[ -d .git ]] && [[ ${AUTO_UPDATE} == '1' ]]; then git pull; fi; if [[ ! -z ${NODE_PACKAGES} ]]; then npm install ${NODE_PACKAGES}; fi; if [[ ! -z ${UNNODE_PACKAGES} ]]; then npm uninstall ${UNNODE_PACKAGES}; fi; if [ -f /home/container/package.json ]; then npm install; fi; if [[ '${MAIN_FILE}' == '*.js' ]]; then node '/home/container/${MAIN_FILE}' ${NODE_ARGS}; else ts-node --esm '/home/container/${MAIN_FILE}' ${NODE_ARGS}; fi"]
