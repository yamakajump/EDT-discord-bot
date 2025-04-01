const { EmbedBuilder, MessageFlags } = require("discord.js");
const { getEmoji } = require("../../../utils/emoji");
const style = require("../../../config/style.json");
const colorEmbed = style.colorEmbed;
const colorEmbedError = style.colorEmbedError;
const thumbnailEmbed = style.thumbnailEmbed;

module.exports = {
  /**
   * Exécute la commande Jour préféré.
   *
   * @param {Object} interaction - L'interaction Discord.
   * @param {Object} targetUser - L'utilisateur cible.
   * @param {Object} jsonData - Les données JSON des statistiques.
   * @param {string} jsonDate - La date associée aux statistiques.
   */
  async execute(interaction, targetUser, jsonData, jsonDate) {
    const emojiInfo = getEmoji("info");

    // Vérification des données de visites
    if (!jsonData || !jsonData.visits || !jsonData.visits.length) {
      const noVisitEmbed = new EmbedBuilder()
        .setColor(colorEmbedError)
        .setTitle("Jour préféré")
        .setThumbnail(thumbnailEmbed)
        .setDescription(
          `${emojiInfo} Aucune visite enregistrée pour **${targetUser.username}**.`,
        );
      return interaction.reply({
        embeds: [noVisitEmbed],
        flags: MessageFlags.Ephemeral,
      });
    }

    // Transformation des visites en dates (format attendu : "DD-MM-YYYY")
    const visitsDay = jsonData.visits.map((entry) => {
      const [day, month, year] = entry.date.split("-");
      return new Date(`${year}-${month}-${day}`);
    });

    // Comptage des visites par jour de la semaine
    const dayCounts = new Array(7).fill(0);
    visitsDay.forEach((date) => {
      const day = date.getDay(); // 0 = dimanche, 1 = lundi, etc.
      dayCounts[day]++;
    });
    const favoriteDayIndex = dayCounts.indexOf(Math.max(...dayCounts));
    // Mapping des jours de la semaine (0 = dimanche, 1 = lundi, etc.)
    const daysOfWeek = [
      "Dimanche",
      "Lundi",
      "Mardi",
      "Mercredi",
      "Jeudi",
      "Vendredi",
      "Samedi",
    ];
    const favoriteDay = daysOfWeek[favoriteDayIndex];
    const favoriteDayCount = dayCounts[favoriteDayIndex];

    const favoriteDayEmbed = new EmbedBuilder()
      .setColor(colorEmbed)
      .setTitle("Jour préféré")
      .setThumbnail(thumbnailEmbed)
      .setDescription(
        `${emojiInfo} **Jour préféré** : Le jour où <@${targetUser.id}> va le plus souvent à la salle est **${favoriteDay}** avec **${favoriteDayCount} visites** !`,
      )
      .setFooter({
        text: `Statistiques BasicFit de ${targetUser.username} du ${jsonDate}`,
      });

    return interaction.reply({ embeds: [favoriteDayEmbed] });
  },
};
