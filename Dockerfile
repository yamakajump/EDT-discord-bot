FROM node:18

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de configuration et installer les dépendances
COPY package*.json ./
RUN npm install

# Copier l'intégralité du projet
COPY . .

# Lancer l'application
CMD ["node", "index.js"]
