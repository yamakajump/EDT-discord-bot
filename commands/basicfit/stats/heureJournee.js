const { EmbedBuilder, MessageFlags } = require("discord.js");

const { getEmoji } = require("../../../utils/emoji");
const emojiCible = getEmoji("cible");
const emojiInfo = getEmoji("info");

const style = require("../../../config/style.json");
const colorEmbed = style.colorEmbed;
const colorEmbedError = style.colorEmbedError;
const thumbnailEmbed = style.thumbnailEmbed;

module.exports = {
  /**
   * Exécute la commande de répartition des visites par heure de la journée.
   *
   * @param {Object} interaction - L'interaction Discord.
   * @param {Object} targetUser - L'utilisateur cible.
   * @param {Object} jsonData - Les données JSON des statistiques.
   * @param {string} jsonDate - La date associée aux statistiques.
   */
  async execute(interaction, targetUser, jsonData, jsonDate) {
    const visits = jsonData.visits;
    if (visits.length === 0) {
      const noVisitEmbed = new EmbedBuilder()
        .setColor(colorEmbedError)
        .setTitle(
          `${emojiCible} Répartition des visites par heure de la journée`,
        )
        .setThumbnail(thumbnailEmbed)
        .setDescription(
          `Aucune visite enregistrée pour **${targetUser.username}**.`,
        );
      return interaction.reply({
        embeds: [noVisitEmbed],
        flags: MessageFlags.Ephemeral,
      });
    }

    // Initialisation des catégories horaires
    const categories = {
      "Nuit (0h-6h)": 0,
      "Matin (6h-12h)": 0,
      "Après-midi (12h-18h)": 0,
      "Soir (18h-24h)": 0,
    };

    visits.forEach((entry) => {
      // On suppose que chaque entrée contient une propriété "time" au format "HH:MM".
      // S'il est absent, on considère 12h comme valeur par défaut.
      let hour = 12;
      if (entry.time) {
        const parts = entry.time.split(":");
        hour = parseInt(parts[0], 10);
      }

      if (hour >= 0 && hour < 6) {
        categories["Nuit (0h-6h)"]++;
      } else if (hour >= 6 && hour < 12) {
        categories["Matin (6h-12h)"]++;
      } else if (hour >= 12 && hour < 18) {
        categories["Après-midi (12h-18h)"]++;
      } else if (hour >= 18 && hour < 24) {
        categories["Soir (18h-24h)"]++;
      }
    });

    const description = Object.entries(categories)
      .map(
        ([cat, count]) => `**${cat}** : ${count} visite${count > 1 ? "s" : ""}`,
      )
      .join("\n");

    const embed = new EmbedBuilder()
      .setColor(colorEmbed)
      .setTitle(`${emojiCible} Répartition des visites par heure de la journée`)
      .setThumbnail(thumbnailEmbed)
      .setDescription(`${emojiInfo} Pour <@${targetUser.id}>,\n${description}`)
      .setFooter({
        text: `Statistiques BasicFit de ${targetUser.username} du ${jsonDate}`,
      });

    return interaction.reply({ embeds: [embed] });
  },
};
