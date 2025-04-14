![Contributors](https://img.shields.io/github/contributors/yamakajump/EDT-discord-bot.svg?style=for-the-badge)
![Forks](https://img.shields.io/github/forks/yamakajump/EDT-discord-bot.svg?style=for-the-badge)
![Stargazers](https://img.shields.io/github/stars/yamakajump/EDT-discord-bot.svg?style=for-the-badge)
![Issues](https://img.shields.io/github/issues/yamakajump/EDT-discord-bot.svg?style=for-the-badge)
![License](https://img.shields.io/github/license/yamakajump/EDT-discord-bot.svg?style=for-the-badge)

![JS](https://img.shields.io/badge/JS-20232A?style=for-the-badge&logo=javascript&logoColor=f1c513)
![Docker](https://img.shields.io/badge/Docker-20232A?style=for-the-badge&logo=docker&logoColor=1D63ED)
![MySQL](https://img.shields.io/badge/MySQL-20232A?style=for-the-badge&logo=mysql&logoColor=00758f)

<img src="https://i.ibb.co/Y795qQQd/logo-EDT.png" align="right" width="40%" />

# Bot Discord pour l'École du Tigre

Bienvenue sur le dépôt du bot Discord pour l'École du Tigre ! Ce bot est conçu pour améliorer l'expérience utilisateur sur le serveur Discord de l'École du Tigre.

> [!NOTE]
> Prenez le temps de lire chaque section afin de bien comprendre la structure, la configuration et la philosophie de développement du projet.

> [!TIP]
> Pour simplifier l’installation et la gestion des dépendances, nous vous recommandons d’utiliser Docker et Docker Compose.

---

## Rejoignez-nous

Pour rejoindre le serveur Discord et participer à la communauté de l'École du Tigre, cliquez sur le lien suivant :

[Rejoindre le Discord](https://discord.gg/ecoledutigre)

---

## Table des matières

- [Prérequis](#prérequis)
- [Configuration](#configuration)
- [Structure du projet](#structure-du-projet)
  - [buttons](./buttons/)
  - [commands](./commands/)
  - [config](./config/)
  - [dao](./dao/)
  - [data](./data/)
  - [events](./events/)
  - [images](./images/)
  - [modals](./modals/)
  - [scheduler](./scheduler/)
  - [sql](./sql/)
  - [utils](./utils/)
- [Lancer le projet avec Docker](#lancer-le-projet-avec-docker)
  - [Démarrer les containers](#démarrer-les-containers)
  - [Reconstruire les images et redémarrer](#reconstruire-les-images-et-redémarrer)
  - [Construire uniquement les images](#construire-uniquement-les-images)
  - [Arrêter et supprimer les containers](#arrêter-et-supprimer-les-containers)
- [Contrôle de la Qualité du Code](#contrôle-de-la-qualité-du-code)
  - [Vérification du Code avec ESLint](#vérification-du-code-avec-eslint)
  - [Formatage du Code avec Prettier](#formatage-du-code-avec-prettier)
- [Contribution](#contribution)
- [Licence](#licence)

---

## Prérequis

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

> [!IMPORTANT]
> Assurez-vous d’avoir Docker et Docker Compose installés pour faciliter le déploiement et l'exécution du bot.

---

## Configuration

Avant de lancer le bot, créez un fichier `.env` à la racine du projet et renseignez les variables d'environnement nécessaires.

Un exemple de fichier `.env` est fourni sous le nom de `.env.example` :

```dotenv
TOKEN=
ID=
MYSQL_HOST=
MYSQL_USER=
MYSQL_PASSWORD=
MYSQL_DATABASE=
```

> [!CAUTION] > **Si vous utilisez Docker**, **ne remplissez pas** les informations relatives à la base de données (`MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`), car elles sont gérées automatiquement via le fichier `docker-compose.yml`.

---

## Structure du projet

Le dépôt est organisé de manière modulaire pour faciliter l’ajout et la maintenance des fonctionnalités :

- **buttons**: Gestion des configurations et actions liées aux boutons interactifs.
- **commands**: Commandes Discord du bot, organisées par catégories.
- **config**: Fichiers de configuration globale du bot.
- **dao**: Data Access Objects pour interagir avec la base de données.
- **data**: Données statiques ou générées utilisées par le bot.
- **events**: Gestion des événements (messages, interactions, etc.) provenant de Discord.
- **images**: Ressources graphiques (logos, images diverses).
- **modals**: Composants modaux pour des interactions avancées.
- **scheduler**: Scripts de planification des tâches (ex. : envoi de messages programmés).
- **sql**: Scripts et outils SQL pour la gestion de la base de données.
- **utils**: Fonctions utilitaires et helpers pour une écriture de code plus claire et efficace.

> [!TIP]
> La structure modulaire vous permet d’ajouter de nouvelles fonctionnalités ou de modifier des comportements existants sans perturber l'ensemble du projet.

---

## Lancer le projet avec Docker

### Démarrer les containers

Pour lancer les containers en arrière-plan (mode détaché) :

```bash
docker-compose up -d
```

### Reconstruire les images et redémarrer

Si vous avez modifié le code ou la configuration :

```bash
docker-compose up --build -d
```

### Construire uniquement les images

Pour reconstruire seulement les images (sans lancer directement les containers) :

```bash
docker-compose build
```

Puis lancez les containers :

```bash
docker-compose up -d
```

### Arrêter et supprimer les containers

Pour arrêter et supprimer les containers :

```bash
docker-compose down
```

Pour supprimer également les images créées :

```bash
docker-compose down --rmi all
```

> [!WARNING]
> Sauvegardez toujours vos données importantes avant d’arrêter ou de supprimer les containers afin d’éviter toute perte accidentelle.

---

## Contrôle de la Qualité du Code

### Vérification du Code avec ESLint

Ce projet intègre [ESLint](https://eslint.org/) afin de vous aider à maintenir une qualité de code optimale et uniforme. Pour utiliser ESLint, suivez ces étapes :

**Lancer la vérification du code**

Une fois l’installation terminée, vous pouvez lancer ESLint sur l’ensemble du projet avec la commande suivante :

```bash
npm run lint
```

Cette commande utilise la configuration définie par défaut dans votre projet (voir le fichier de configuration ESLint si présent ou les options par défaut) pour analyser vos fichiers JavaScript et vous signaler d’éventuelles erreurs ou incohérences.

### Formatage du Code avec Prettier

Pour maintenir une cohérence dans le projet et garantir que tout le code suit le même formatage, nous utilisons Prettier.

**Formater le code avant de push**

Lancez la commande suivante pour formater l'ensemble du projet :

```bash
npm run prettier
```

Cette commande s’assure que tous les fichiers respectent le format de code défini, ce qui rend le code plus lisible et facilite la collaboration.

---

## Contribution

Les contributions sont essentielles pour améliorer ce projet ! Si vous souhaitez ajouter une nouvelle fonctionnalité ou corriger un bug, suivez les étapes ci-dessous :

1. **Forkez** le dépôt.
2. Créez une branche pour votre fonctionnalité :
   ```bash
   git checkout -b feature/nom-de-votre-fonctionnalite
   ```
3. Apportez vos modifications et commitez-les :
   ```bash
   git commit -m "Ajout de la fonctionnalité X"
   ```
4. Poussez votre branche :
   ```bash
   git push origin feature/nom-de-votre-fonctionnalite
   ```
5. Ouvrez une Pull Request pour proposer vos modifications.

> [!NOTE]
> Toute contribution, même la plus minime, est **grandement appréciée**. Merci pour votre engagement !

---

## Licence

Ce projet est distribué sous licence MIT.  
Vous êtes libre de l’utiliser, de le modifier et de le redistribuer dans le respect des termes de la licence.

Pour plus de détails, consultez directement le fichier [LICENSE](./LICENSE).

---

<p align="right">(<a href="#bot-discord-pour-lécole-du-tigre">back to top</a>)</p>
