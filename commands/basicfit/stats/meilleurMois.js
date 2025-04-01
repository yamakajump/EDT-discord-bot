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
   * Exécute la commande Meilleur Mois.
   *
   * @param {Object} interaction - L'interaction Discord.
   * @param {Object} targetUser - L'utilisateur cible.
   * @param {Object} jsonData - Les données JSON des statistiques.
   * @param {string} jsonDate - La date associée aux statistiques.
   */
  async execute(interaction, targetUser, jsonData, jsonDate) {
    // Transformation des visites en dates (format attendu : "DD-MM-YYYY")
    const visitsMonth = jsonData.visits.map((entry) => {
      const [day, month, year] = entry.date.split("-");
      return new Date(`${year}-${month}-${day}`);
    });

    if (!visitsMonth.length) {
      const noVisitEmbed = new EmbedBuilder()
        .setColor(colorEmbedError)
        .setTitle(`${emojiCible} Meilleur mois`)
        .setThumbnail(thumbnailEmbed)
        .setDescription(
          `${emojiInfo} Aucune visite enregistrée pour **${targetUser.username}**.`,
        );
      return interaction.reply({
        embeds: [noVisitEmbed],
        flags: MessageFlags.Ephemeral,
      });
    }

    // Regroupement des visites par mois-années
    const monthlyVisits = {};
    visitsMonth.forEach((date) => {
      const month = date.getUTCMonth();
      const year = date.getUTCFullYear();
      const monthKey = `${year}-${month}`;
      if (!monthlyVisits[monthKey]) monthlyVisits[monthKey] = 0;
      monthlyVisits[monthKey]++;
    });

    // Recherche du mois avec le maximum de visites
    const bestMonth = Object.entries(monthlyVisits).reduce((best, current) =>
      current[1] > best[1] ? current : best,
    );
    const [bestMonthKey, bestMonthCount] = bestMonth;
    const [year, monthIndex] = bestMonthKey.split("-").map(Number);
    const monthNames = [
      "Janvier",
      "Février",
      "Mars",
      "Avril",
      "Mai",
      "Juin",
      "Juillet",
      "Août",
      "Septembre",
      "Octobre",
      "Novembre",
      "Décembre",
    ];
    const bestMonthName = `${monthNames[monthIndex]} ${year}`;

    const bestMonthEmbed = new EmbedBuilder()
      .setColor(colorEmbed)
      .setTitle(`${emojiCible} Meilleur mois`)
      .setThumbnail(thumbnailEmbed)
      .setDescription(
        `${emojiInfo} **Meilleur mois** : Le mois où <@${targetUser.id}> est allé le plus souvent à la salle est **${bestMonthName}** avec **${bestMonthCount} visites** !`,
      )
      .setFooter({
        text: `Statistiques BasicFit de ${targetUser.username} du ${jsonDate}`,
      });

    return interaction.reply({ embeds: [bestMonthEmbed] });
  },
};
