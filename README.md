<img src="https://i.ibb.co/Y795qQQd/logo-EDT.png" align="right" width="40%" />

# Bot Discord pour l'École du Tigre

Bienvenue sur le dépôt du bot Discord pour l'École du Tigre ! Ce bot est conçu pour améliorer l'expérience utilisateur sur le serveur Discord de l'École du Tigre.

## Prérequis

- [Docker](https://docs.docker.com/get-docker/)  
- [Docker Compose](https://docs.docker.com/compose/install/)

## Configuration

Avant de lancer le bot, créez un fichier `.env` à la racine du projet et renseignez les variables d'environnement nécessaires :

```dotenv
TOKEN=
ID=
MYSQL_HOST=
MYSQL_USER=
MYSQL_PASSWORD=
MYSQL_DATABASE=
```

## Lancer le projet avec Docker

### Démarrer les containers

Pour lancer les containers en arrière-plan (mode détaché) :

```bash
docker-compose up -d
```

### Reconstruire les images et redémarrer

Si vous avez modifié le code ou la configuration et que vous souhaitez reconstruire les images :

```bash
docker-compose up --build -d
```

### Construire uniquement les images

Pour reconstruire seulement les images (sans lancer automatiquement les containers) :

```bash
docker-compose build
```

Puis, lancez les containers :

```bash
docker-compose up -d
```

### Arrêter et supprimer les containers

Pour arrêter et supprimer les containers (et éventuellement nettoyer les images) :

```bash
docker-compose down
```

Pour supprimer les containers ainsi que les images créées :

```bash
docker-compose down --rmi all
```

## Rejoignez-nous

Pour rejoindre le serveur Discord de l'École du Tigre, cliquez sur le lien suivant :  
[https://discord.gg/ecoledutigre](https://discord.gg/ecoledutigre)

## Contribution

Les contributions sont bienvenues ! Voici la marche à suivre :

1. **Forker** le projet.
2. Créer une branche pour votre fonctionnalité :
   ```bash
   git checkout -b feature-ma-nouvelle-fonctionnalite
   ```
3. Commiter vos changements :
   ```bash
   git commit -m "Ajout d'une nouvelle fonctionnalité"
   ```
4. Pousser votre branche :
   ```bash
   git push origin feature-ma-nouvelle-fonctionnalite
   ```
5. Ouvrir une Pull Request.

## Licence

Ce projet est sous licence MIT. Vous êtes libre de l’utiliser, de le modifier et de le redistribuer dans le respect des termes de la licence.

Pour plus de détails, consultez le fichier [LICENSE](./LICENSE).