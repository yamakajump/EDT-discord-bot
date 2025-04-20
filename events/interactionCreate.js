/**
 * Gestionnaire de l'événement "interactionCreate".
 *
 * Ce module gère les interactions reçues par le bot, que ce soit des commandes, des soumissions de modal ou des clics de bouton.
 *
 * Pour chaque type d'interaction, il recherche dynamiquement le gestionnaire approprié et exécute la logique correspondante.
 */

const { MessageFlags } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
  name: "interactionCreate",
  /**
   * Exécute le gestionnaire d'interaction.
   *
   * @param {Interaction} interaction - L'interaction reçue.
   * @param {Client} client - Le client Discord.
   */
  execute: async (interaction, client) => {
    const user = interaction.guild
      ? interaction.guild.members.cache.get(interaction.user.id)?.displayName ||
        interaction.user.username
      : interaction.user.username;

    // Gestion des commandes slash
    if (interaction.isCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) {
        console.error(
          `⚠️\x1b[38;5;1m  Commande ${interaction.commandName} non trouvée.`,
        );
        return;
      }

      try {
        console.log(
          `\x1b[38;5;4mCommande exécutée par ${user}: ${interaction.commandName}\x1b[0m`,
        );
        await command.execute(interaction);
      } catch (error) {
        console.error(
          `⚠️\x1b[38;5;1m  Erreur lors de l'exécution de la commande ${interaction.commandName} par ${user}:`,
          error,
        );
        await interaction.reply({
          content:
            "Une erreur s'est produite lors de l'exécution de cette commande.",
          flags: MessageFlags.Ephemeral,
        });
      }
    }

    // Gestion des soumissions de modal (formulaire)
    if (interaction.isModalSubmit()) {
      // Construit le chemin vers le gestionnaire de modal en se basant sur l'ID personnalisé
      const modalHandlerPath = path.join(
        __dirname,
        "../modals",
        `${interaction.customId}.js`,
      );
      if (fs.existsSync(modalHandlerPath)) {
        const modalHandler = require(modalHandlerPath);
        try {
          console.log(
            `\x1b[38;5;2mModal soumis par ${user}: ${interaction.customId}\x1b[0m`,
          );
          await modalHandler.execute(interaction);
        } catch (error) {
          console.error(
            `⚠️\x1b[38;5;1m  Erreur lors du traitement du modal ${interaction.customId} par ${user}:`,
            error,
          );
        }
      } else {
        console.error(
          `⚠️\x1b[38;5;1m  Handler de modal ${interaction.customId} non trouvé.`,
        );
      }
    }

    // Gestion des clics sur les boutons
    if (interaction.isButton()) {
      // On divise le customId pour extraire le nom et les paramètres éventuels
      const [buttonName, ...params] = interaction.customId.split(":");
      const buttonHandlerPath = path.join(
        __dirname,
        "../buttons",
        `${buttonName}.js`,
      );

      if (fs.existsSync(buttonHandlerPath)) {
        const buttonHandler = require(buttonHandlerPath);
        try {
          console.log(
            `\x1b[38;5;6mBouton cliqué par ${user}: ${buttonName}\x1b[0m`,
          );
          await buttonHandler.execute(interaction, params);
        } catch (error) {
          console.error(
            `⚠️\x1b[38;5;1m  Erreur lors du traitement du bouton ${interaction.customId} par ${user}:`,
            error,
          );
        }
      } else {
        console.error(
          `⚠️\x1b[38;5;1m  Handler de bouton ${buttonName} non trouvé.`,
        );
      }
    }
  },
};
