/**
 * Module de gestion du guide interactif.
 *
 * Ce module permet de gérer les interactions sur le guide en naviguant entre
 * les différentes pages (page suivante, précédente ou retour à l'accueil).
 *
 * Fonctions principales utilisées :
 *   - getGuideEmbed : Retourne l'embed correspondant à la page du guide.
 *   - getGuideButtons : Retourne les boutons de navigation pour le guide.
 *
 * Les vérifications suivantes sont effectuées :
 *   - Seul l'utilisateur destinataire du guide peut interagir avec celui-ci.
 *   - Si la page demandée n'existe pas, le guide retourne à la première page.
 *
 * Pour maintenir ce module, il suffit d'adapter les fonctions utilitaires
 * getGuideEmbed et getGuideButtons dans le dossier utils.
 */

const { getGuideEmbed, getGuideButtons } = require("../utils/guide");
const { MessageFlags } = require("discord.js");

module.exports = {
  async execute(interaction, params) {
    const [action, page, memberId] = params;
    let currentPage = parseInt(page, 10);

    if (interaction.user.id !== memberId) {
      return interaction.reply({
        content: "❌ Ce guide ne vous est pas destiné.",
        flags: MessageFlags.Ephemeral,
      });
    }

    let newPage;
    switch (action) {
      case "next":
        newPage = currentPage + 1;
        break;
      case "previous":
        newPage = currentPage - 1;
        break;
      case "home":
        newPage = 1;
        break;
      default:
        newPage = 1;
        break;
    }

    if (!getGuideEmbed(newPage, interaction.user)) {
      newPage = 1;
    }

    const guideEmbed = getGuideEmbed(newPage, interaction.user);
    const row = getGuideButtons(newPage, interaction.user.id);
    await interaction.update({ embeds: [guideEmbed], components: [row] });
  },
};
