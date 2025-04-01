const { EmbedBuilder, MessageFlags } = require("discord.js");
const { getEmoji } = require("../../../utils/emoji");

module.exports = {
  /**
   * Exécute la commande Temps moyen entre les visites.
   *
   * @param {Object} interaction - L'interaction Discord.
   * @param {Object} targetUser - L'utilisateur cible.
   * @param {Object} jsonData - Les données JSON des statistiques.
   * @param {string} jsonDate - La date associée aux statistiques.
   */
  async execute(interaction, targetUser, jsonData, jsonDate) {
    const emojiInfo = getEmoji("info");
    // Transformation des visites en dates et tri chronologique
    const avgVisits = jsonData.visits
      .map((entry) => {
        const [day, month, year] = entry.date.split("-");
        return new Date(`${year}-${month}-${day}`);
      })
      .sort((a, b) => a - b);

    if (avgVisits.length < 2) {
      const notEnoughEmbed = new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle("Temps moyen entre les visites")
        .setThumbnail("https://i.ibb.co/Y795qQQd/logo-EDT.png")
        .setDescription(
          `${emojiInfo} Pas assez de données pour calculer la moyenne de temps entre les visites pour **${targetUser.username}**.`,
        )
        .setFooter({
          text: `Statistiques BasicFit de ${targetUser.username} du ${jsonDate}`,
        });
      return interaction.reply({
        embeds: [notEnoughEmbed],
        flags: MessageFlags.Ephemeral,
      });
    }

    let totalDaysBetweenVisits = 0;
    for (let i = 1; i < avgVisits.length; i++) {
      const diffInTime = avgVisits[i] - avgVisits[i - 1];
      const diffInDays = diffInTime / (1000 * 60 * 60 * 24);
      totalDaysBetweenVisits += diffInDays;
    }
    const avgTimeBetweenVisits = (
      totalDaysBetweenVisits /
      (avgVisits.length - 1)
    ).toFixed(2);

    const avgVisitsEmbed = new EmbedBuilder()
      .setColor("#FFA500")
      .setTitle("Temps moyen entre les visites")
      .setThumbnail("https://i.ibb.co/Y795qQQd/logo-EDT.png")
      .setDescription(
        `${emojiInfo} **Temps moyen entre les visites** : <@${targetUser.id}> a une moyenne de **${avgTimeBetweenVisits} jours** entre deux séances.`,
      )
      .setFooter({
        text: `Statistiques BasicFit de ${targetUser.username} du ${jsonDate}`,
      });

    return interaction.reply({ embeds: [avgVisitsEmbed] });
  },
};
