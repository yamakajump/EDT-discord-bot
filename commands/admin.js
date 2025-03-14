const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('admin')
    .setDescription('Commandes administratives')
    // Sous-commande : styx
    .addSubcommand(subcommand =>
      subcommand
        .setName('styx')
        .setDescription('Ajoute ou enlève un utilisateur du Styx.')
        .addUserOption(option =>
          option.setName('membre')
            .setDescription('Le membre ciblé')
            .setRequired(true)
        )
    )
    // Sous-commande : save
    .addSubcommand(subcommand =>
      subcommand
        .setName('save')
        .setDescription('Sauvegarde des informations dans un salon spécifié.')
        .addChannelOption(option =>
          option.setName('salon')
            .setDescription('Le salon où sauvegarder')
            .setRequired(true)
        )
    )
    // Nouvelle sous-commande : journal
    .addSubcommand(subcommand =>
      subcommand
        .setName('journal')
        .setDescription('Crée un journal pour un membre')
        .addUserOption(option =>
          option.setName('membre')
            .setDescription("Le membre pour lequel créer le journal")
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('accessibilite')
            .setDescription("Détermine qui peut voir le journal : Tout le monde, Donateur ou Staff")
            .setRequired(true)
            .addChoices(
              { name: 'Tout le monde', value: 'public' },
              { name: 'Donateur', value: 'donateur' },
              { name: 'Staff', value: 'staff' }
            )
        )
    ),
  async execute(interaction) {
    const subCmd = interaction.options.getSubcommand();
    try {
      const subcommandFile = require(path.join(__dirname, 'admin', `${subCmd}.js`));
      await subcommandFile.execute(interaction);
    } catch (error) {
      console.error(`Erreur lors de l'exécution de la sous-commande ${subCmd}:`, error);
      await interaction.reply({
        content: `Une erreur est survenue lors de l'exécution de la commande admin ${subCmd}.`,
        flags: MessageFlags.Ephemeral
      });
    }
  }
};
