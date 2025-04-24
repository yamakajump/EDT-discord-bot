const fs = require("fs");
const path = require("path");
const {
  Client,
  GatewayIntentBits,
  Collection,
  REST,
  Routes,
} = require("discord.js");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

// Importer et attendre l'initialisation de la base de données
const { initializeDatabase } = require("./utils/dbInit");

(async () => {
  try {
    // Attendre l'initialisation de la base (création des tables, etc.)
    await initializeDatabase();

    // Créez une instance du bot
    const client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });

    // Collection des commandes
    client.commands = new Collection();
    const commands = [];

    // Charger toutes les commandes depuis le dossier "commands"
    const commandsPath = path.join(__dirname, "commands");
    const commandFiles = fs
      .readdirSync(commandsPath)
      .filter((file) => file.endsWith(".js"));
    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const command = require(filePath);
      if (command.data && command.data.name) {
        client.commands.set(command.data.name, command);
        commands.push(command.data.toJSON());
        console.log(
          `📜\x1b[38;5;4m  Chargement de la commande ${command.data.name} \x1b[0m`,
        );
      } else {
        console.error(
          `⚠️ \x1b[38;5;1m  Erreur: La commande dans le fichier ${file} est invalide ou n'a pas de nom. \x1b[0m`,
        );
      }
    }

    // Charger les événements
    const eventsPath = path.join(__dirname, "events");
    const eventFiles = fs
      .readdirSync(eventsPath)
      .filter((file) => file.endsWith(".js"));
    for (const file of eventFiles) {
      const filePath = path.join(eventsPath, file);
      const event = require(filePath);
      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
        console.log(
          `📜\x1b[38;5;5m  Chargement de l'événement ${event.name} (once) \x1b[0m`,
        );
      } else {
        client.on(event.name, (...args) => event.execute(...args, client));
        console.log(
          `📜\x1b[38;5;5m  Chargement de l'événement ${event.name} \x1b[0m`,
        );
      }
    }

    // Préparer l'API REST avec le token du bot
    const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
    const clientId = process.env.ID;

    // Récupérer les commandes actuellement enregistrées sur Discord
    let registeredCommands = [];
    try {
      registeredCommands = await rest.get(Routes.applicationCommands(clientId));
    } catch (error) {
      console.error(
        "⚠️\x1b[38;5;1m  Erreur lors de la récupération des commandes enregistrées: \x1b[0m",
        error,
      );
    }

    // Supprimer les commandes enregistrées qui ne sont plus présentes localement
    for (const registeredCommand of registeredCommands) {
      if (!client.commands.has(registeredCommand.name)) {
        try {
          await rest.delete(
            `${Routes.applicationCommands(clientId)}/${registeredCommand.id}`,
          );
          console.log(
            `📍\x1b[38;5;3m  Suppression de la commande obsolète: ${registeredCommand.name} \x1b[0m`,
          );
        } catch (error) {
          console.error(
            `⚠️\x1b[38;5;1m  Erreur lors de la suppression de la commande ${registeredCommand.name}: \x1b[0m`,
            error,
          );
        }
      }
    }

    // Enregistrer (ou mettre à jour) les commandes auprès de Discord
    try {
      await rest.put(Routes.applicationCommands(clientId), { body: commands });
      console.log(
        "📩\x1b[38;5;2m  Commandes enregistrées avec succès. \x1b[0m",
      );
    } catch (error) {
      console.error(
        "⚠️\x1b[38;5;1m  Erreur lors de l'enregistrement des commandes: \x1b[0m",
        error,
      );
    }

    // Lancer le bot
    client.login(process.env.TOKEN);
  } catch (err) {
    console.error(
      "⚠️\x1b[38;5;1m  Erreur lors de l'initialisation de la base de données ou du bot:",
      err,
    );
    process.exit(1);
  }
})();
