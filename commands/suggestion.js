const { 
  SlashCommandBuilder, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
  ActionRowBuilder 
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName("suggest")
    .setDescription("Soumet une suggestion via un modal"),
    
  async execute(interaction) {
    // Création du modal
    const modal = new ModalBuilder()
      .setCustomId('suggestionModal')
      .setTitle('📢 Ta Suggestion');

    // Création du champ pour le titre
    const titleInput = new TextInputBuilder()
      .setCustomId('titre')
      .setLabel("Le titre de ta suggestion")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    // Création du champ pour le contenu
    const contentInput = new TextInputBuilder()
      .setCustomId('contenu')
      .setLabel("Décris ta suggestion en détails")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    // Ajout des champs dans des ActionRows
    const firstActionRow = new ActionRowBuilder().addComponents(titleInput);
    const secondActionRow = new ActionRowBuilder().addComponents(contentInput);

    modal.addComponents(firstActionRow, secondActionRow);

    // Affiche le modal à l'utilisateur
    await interaction.showModal(modal);
  },
};
