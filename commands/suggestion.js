/**
 * Module de commande "suggest"
 *
 * Permet aux utilisateurs de soumettre des suggestions via un modal interactif.
 * Le modal contient deux champs :
 *   - Un champ pour saisir le titre de la suggestion.
 *   - Un champ pour saisir la description détaillée de la suggestion.
 *
 * Lorsqu'un utilisateur exécute la commande "suggest", le modal s'affiche pour
 * recueillir ces informations.
 */

const {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require("discord.js");

module.exports = {
  // Définition de la commande avec son nom et sa description.
  data: new SlashCommandBuilder()
    .setName("suggest")
    .setDescription("Soumet une suggestion via un modal"),

  async execute(interaction) {
    // Création du modal avec un identifiant personnalisé et un titre.
    const modal = new ModalBuilder()
      .setCustomId("suggestionModal")
      .setTitle("📢 Ta Suggestion");

    // Création du champ de saisie pour le titre de la suggestion.
    const titleInput = new TextInputBuilder()
      .setCustomId("titre")
      .setLabel("Le titre de ta suggestion")
      .setStyle(TextInputStyle.Short) // Utilisation d'un champ court pour le titre.
      .setRequired(true);

    // Création du champ de saisie pour le contenu de la suggestion.
    const contentInput = new TextInputBuilder()
      .setCustomId("contenu")
      .setLabel("Décris ta suggestion en détails")
      .setStyle(TextInputStyle.Paragraph) // Champ de saisie multiple lignes pour le contenu.
      .setRequired(true);

    // Ajout des champs dans des ActionRows (un ActionRow par champ).
    const firstActionRow = new ActionRowBuilder().addComponents(titleInput);
    const secondActionRow = new ActionRowBuilder().addComponents(contentInput);

    // Ajout des ActionRows au modal.
    modal.addComponents(firstActionRow, secondActionRow);

    // Affichage du modal à l'utilisateur.
    await interaction.showModal(modal);
  },
};
