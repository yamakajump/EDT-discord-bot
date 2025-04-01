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
   * Exécute la commande Streak Day.
   *
   * @param {Object} interaction - L'interaction Discord.
   * @param {Object} targetUser - L'utilisateur cible.
   * @param {Object} jsonData - Les données JSON des statistiques.
   * @param {string} jsonDate - La date associée aux statistiques.
   */
  async execute(interaction, targetUser, jsonData, jsonDate) {
    // Vérification des visites dans jsonData
    if (!jsonData || !jsonData.visits || !jsonData.visits.length) {
      const noVisitEmbed = new EmbedBuilder()
        .setColor(colorEmbedError)
        .setTitle(`${emojiCible} Série consécutive`)
        .setThumbnail(thumbnailEmbed)
        .setDescription(
          `Aucune visite enregistrée pour **${targetUser.username}**.`,
        );
      return interaction.reply({
        embeds: [noVisitEmbed],
        flags: MessageFlags.Ephemeral,
      });
    }

    // Transformation des dates (on suppose le format "DD-MM-YYYY")
    const visits = jsonData.visits.map((entry) => {
      const [day, month, year] = entry.date.split("-");
      return new Date(`${year}-${month}-${day}`);
    });

    if (visits.length === 0) {
      const noVisitEmbed = new EmbedBuilder()
        .setColor(colorEmbedError)
        .setTitle(`${emojiCible} Série consécutive`)
        .setDescription(
          `Aucune visite enregistrée pour **${targetUser.username}**.`,
        );
      return interaction.reply({
        embeds: [noVisitEmbed],
        flags: MessageFlags.Ephemeral,
      });
    }

    // Tri des dates dans l'ordre croissant
    visits.sort((a, b) => a - b);

    let longestStreak = 0;
    let currentStreak = 1;

    for (let i = 1; i < visits.length; i++) {
      const diff = (visits[i] - visits[i - 1]) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        currentStreak++;
      } else if (diff === 0) {
        // Même jour, on ne compte pas double
      } else {
        if (currentStreak > longestStreak) longestStreak = currentStreak;
        currentStreak = 1;
      }
    }

    if (currentStreak > longestStreak) longestStreak = currentStreak;

    const embed = new EmbedBuilder()
      .setColor(colorEmbed)
      .setTitle(`${emojiCible} Série consécutive`)
      .setThumbnail(thumbnailEmbed)
      .setDescription(
        `${emojiInfo} Le plus long streak journalier de <@${targetUser.id}> est de **${longestStreak} jours consécutifs**.`,
      )
      .setFooter({
        text: `Statistiques BasicFit de ${targetUser.username} du ${jsonDate}`,
      });

    return interaction.reply({ embeds: [embed] });
  },
};
