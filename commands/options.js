/**
 * Module de commande "options"
 *
 * Cette commande slash "options" gère la configuration des options :
 *   - statsvisibilite : Permet de modifier la visibilité des statistiques.
 *
 * La logique d'exécution consiste à importer et exécuter le module correspondant
 * à la sous-commande utilisée par l'utilisateur.
 */

const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const path = require("path");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("options")
    .setDescription("Commandes d'options")
    // Sous-commande : statsvisibilite
    .addSubcommand((subcommand) =>
      subcommand
        .setName("statsvisibilite")
        .setDescription("Change la visibilité des statistiques")
        .addStringOption((option) =>
          option
            .setName("visibilite")
            .setDescription("Choisissez la visibilité des statistiques")
            .setRequired(true)
            .addChoices(
              { name: "Public", value: "public" },
              { name: "Privé", value: "prive" },
            ),
        ),
    ),
  async execute(interaction) {
    const subCmd = interaction.options.getSubcommand();
    try {
      const subcommandFile = require(
        path.join(__dirname, "options", `${subCmd}.js`),
      );
      await subcommandFile.execute(interaction);
    } catch (error) {
      console.error(
        `Erreur lors de l'exécution de la sous-commande ${subCmd}:`,
        error,
      );
      await interaction.reply({
        content: `Une erreur est survenue lors de l'exécution de la commande options ${subCmd}.`,
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
