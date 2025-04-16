/**
 * Module de commande "admin"
 *
 * Cette commande slash "admin" regroupe plusieurs sous-commandes administratives :
 *   - styx : Permet d'ajouter ou d'enlever un utilisateur du Styx.
 *   - save : Sauvegarde des informations dans un salon spécifié.
 *   - journal : Crée un journal pour un membre.
 *
 * La logique d'exécution consiste à importer et exécuter le module correspondant
 * à la sous-commande utilisée par l'utilisateur.
 *
 * Pour ajouter ou modifier une sous-commande, il suffit d'ajouter un nouveau builder
 * et de créer le fichier correspondant dans le dossier "admin".
 */

const {
  SlashCommandBuilder,
  MessageFlags,
  PermissionFlagsBits,
} = require("discord.js");
const path = require("path");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("admin")
    .setDescription("Commandes administratives")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    // Sous-commande : styx
    .addSubcommand((subcommand) =>
      subcommand
        .setName("styx")
        .setDescription("Ajoute ou enlève un utilisateur du Styx.")
        .addUserOption((option) =>
          option
            .setName("membre")
            .setDescription("Le membre ciblé")
            .setRequired(true),
        ),
    )
    // Sous-commande : save
    .addSubcommand((subcommand) =>
      subcommand
        .setName("save")
        .setDescription("Sauvegarde des informations dans un salon spécifié.")
        .addChannelOption((option) =>
          option
            .setName("salon")
            .setDescription("Le salon où sauvegarder")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("format")
            .setDescription(
              'Format de sortie : "pdf" ou "html" (par défaut: pdf)',
            )
            .addChoices(
              { name: "PDF", value: "pdf" },
              { name: "HTML", value: "html" },
            )
            .setRequired(false),
        ),
    )
    // Sous-commande : journal
    .addSubcommand((subcommand) =>
      subcommand
        .setName("journal")
        .setDescription("Crée un journal pour un membre.")
        .addUserOption((option) =>
          option
            .setName("membre")
            .setDescription("Le membre pour lequel créer le journal")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("accessibilite")
            .setDescription(
              "Détermine qui peut voir le journal : Tout le monde, Donateur ou Staff",
            )
            .setRequired(true)
            .addChoices(
              { name: "Tout le monde", value: "public" },
              { name: "Donateur", value: "donateur" },
              { name: "Staff", value: "staff" },
            ),
        ),
    ),
  async execute(interaction) {
    const subCmd = interaction.options.getSubcommand();
    try {
      const subcommandFile = require(
        path.join(__dirname, "admin", `${subCmd}.js`),
      );
      await subcommandFile.execute(interaction);
    } catch (error) {
      console.error(
        `⚠️\x1b[31m  Erreur lors de l'exécution de la sous-commande ${subCmd}:`,
        error,
      );
      await interaction.reply({
        content: `Une erreur est survenue lors de l'exécution de la commande admin ${subCmd}.`,
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
