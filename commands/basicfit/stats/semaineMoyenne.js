const { EmbedBuilder, MessageFlags } = require("discord.js");
const { getEmoji } = require("../../../utils/emoji");
const style = require("../../../config/style.json");
const colorEmbed = style.colorEmbed;
const colorEmbedError = style.colorEmbedError;
const thumbnailEmbed = style.thumbnailEmbed;

module.exports = {
  /**
   * Exécute la commande Average Week.
   *
   * @param {Object} interaction - L'interaction Discord.
   * @param {Object} targetUser - L'utilisateur cible.
   * @param {Object} jsonData - Les données JSON des statistiques.
   * @param {string} jsonDate - La date associée aux statistiques.
   */
  async execute(interaction, targetUser, jsonData, jsonDate) {
    // Transformation des visites en dates
    const averageWeekVisits = jsonData.visits.map((entry) => {
      const [day, month, year] = entry.date.split("-");
      return new Date(`${year}-${month}-${day}`);
    });

    const emojiInfo = getEmoji("info");
    const emojiBoule = getEmoji("boule");

    if (!averageWeekVisits.length) {
      const noVisitEmbed = new EmbedBuilder()
        .setColor(colorEmbedError)
        .setTitle("Semaine moyenne")
        .setDescription(
          `${emojiInfo} Aucune visite enregistrée pour **${targetUser.username}**.`,
        )
        .setFooter({
          text: `Statistiques BasicFit de ${targetUser.username} du ${jsonDate}`,
        });
      return interaction.reply({
        embeds: [noVisitEmbed],
        flags: MessageFlags.Ephemeral,
      });
    }

    // Regroupement des visites par semaine-années
    const weeklyVisits = {};
    averageWeekVisits.forEach((date) => {
      const year = date.getUTCFullYear();
      const week = Math.floor(
        (date - new Date(year, 0, 1)) / (1000 * 60 * 60 * 24 * 7),
      );
      const weekKey = `${year}-W${week}`;
      if (!weeklyVisits[weekKey]) weeklyVisits[weekKey] = 0;
      weeklyVisits[weekKey]++;
    });

    const totalWeeks = Object.keys(weeklyVisits).length;
    const totalVisits = Object.values(weeklyVisits).reduce((a, b) => a + b, 0);
    const averagePerWeek = (totalVisits / totalWeeks).toFixed(2);

    const averageWeekEmbed = new EmbedBuilder()
      .setColor(colorEmbed)
      .setTitle("Semaine moyenne")
      .setThumbnail(thumbnailEmbed)
      .setDescription(
        `${emojiBoule} **Semaine moyenne** : <@${targetUser.id}> va à la salle en moyenne **${averagePerWeek} jours par semaine** !`,
      )
      .setFooter({
        text: `Statistiques BasicFit de ${targetUser.username} du ${jsonDate}`,
      });

    return interaction.reply({ embeds: [averageWeekEmbed] });
  },
};
