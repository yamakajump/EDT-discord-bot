const { EmbedBuilder, MessageFlags } = require("discord.js");

const { getEmoji } = require("../../../utils/emoji");
const emojiCible = getEmoji("cible");
const emojiInfo = getEmoji("info");

const style = require("../../../config/style.json");
const colorEmbed = style.colorEmbed;
const colorEmbedError = style.colorEmbedError;
const thumbnailEmbed = style.thumbnailEmbed;

/**
 * Exécute la commande affichant le nombre de visites par jour de la semaine.
 *
 * @param {Object} interaction - L'interaction Discord.
 * @param {Object} targetUser - L'utilisateur cible.
 * @param {Object} jsonData - Les données JSON des statistiques.
 * @param {string} jsonDate - La date associée aux statistiques.
 */
module.exports = {
  async execute(interaction, targetUser, jsonData, jsonDate) {
    const visits = jsonData.visits || [];
    if (visits.length === 0) {
      const noVisitEmbed = new EmbedBuilder()
        .setColor(colorEmbedError)
        .setTitle(`${emojiCible} Nombre de visites par jour`)
        .setThumbnail(thumbnailEmbed)
        .setDescription(
          `Aucune visite enregistrée pour **${targetUser.username}**.`,
        );
      return interaction.reply({
        embeds: [noVisitEmbed],
        flags: MessageFlags.Ephemeral,
      });
    }

    // Tableau des jours de la semaine (0 -> Dimanche, 1 -> Lundi, etc.)
    const daysOfWeek = [
      "Dimanche",
      "Lundi",
      "Mardi",
      "Mercredi",
      "Jeudi",
      "Vendredi",
      "Samedi",
    ];
    const dayCounts = {
      Dimanche: 0,
      Lundi: 0,
      Mardi: 0,
      Mercredi: 0,
      Jeudi: 0,
      Vendredi: 0,
      Samedi: 0,
    };

    visits.forEach((entry) => {
      // On suppose que la date est au format "DD-MM-YYYY"
      const [day, month, year] = entry.date.split("-");
      const date = new Date(`${year}-${month}-${day}`);
      const dayName = daysOfWeek[date.getDay()];
      dayCounts[dayName]++;
    });

    const description = Object.entries(dayCounts)
      .map(
        ([day, count]) => `**${day}** : ${count} visite${count > 1 ? "s" : ""}`,
      )
      .join("\n");

    const embed = new EmbedBuilder()
      .setColor(colorEmbed)
      .setTitle(`${emojiCible} Nombre de visites par jour`)
      .setThumbnail(thumbnailEmbed)
      .setDescription(`${emojiInfo} Pour <@${targetUser.id}>,\n${description}`)
      .setFooter({
        text: `Statistiques BasicFit de ${targetUser.username} du ${jsonDate}`,
      });

    return interaction.reply({ embeds: [embed] });
  },
};
