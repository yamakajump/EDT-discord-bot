const { EmbedBuilder, MessageFlags } = require("discord.js");
const style = require("../../../config/style.json");
const colorEmbed = style.colorEmbed;
const colorEmbedError = style.colorEmbedError;
const thumbnailEmbed = style.thumbnailEmbed;

/**
 * Calcule le numéro de la semaine ISO pour une date donnée.
 * @param {Date} date
 * @returns {number} numéro de semaine (ISO)
 */
function getISOWeek(date) {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const diff = target - firstThursday;
  return 1 + Math.floor(diff / (7 * 24 * 3600 * 1000));
}

module.exports = {
  /**
   * Exécute la commande Streak Hebdomadaire.
   *
   * @param {Object} interaction - L'interaction Discord.
   * @param {Object} targetUser - L'utilisateur cible.
   * @param {Object} jsonData - Les données JSON des statistiques.
   * @param {string} jsonDate - La date associée aux statistiques.
   */
  async execute(interaction, targetUser, jsonData, jsonDate) {
    if (!jsonData || !jsonData.visits || jsonData.visits.length === 0) {
      const noVisitEmbed = new EmbedBuilder()
        .setColor(colorEmbedError)
        .setTitle("Streak Hebdomadaire")
        .setThumbnail(thumbnailEmbed)
        .setDescription(
          `Aucune visite enregistrée pour **${targetUser.username}**.`,
        );
      return interaction.reply({
        embeds: [noVisitEmbed],
        flags: MessageFlags.Ephemeral,
      });
    }

    const visits = jsonData.visits;

    // Création d'un ensemble d'identifiants uniques de semaine ("année-semaine")
    const weeksSet = new Set();
    visits.forEach((entry) => {
      // On suppose que la date est au format "DD-MM-YYYY"
      const [day, month, year] = entry.date.split("-");
      const date = new Date(`${year}-${month}-${day}`);
      const week = getISOWeek(date);
      const yearNum = date.getFullYear();
      weeksSet.add(`${yearNum}-${week}`);
    });

    // Tri des identifiants (exemple : "2022-35")
    const weeks = Array.from(weeksSet).sort((a, b) => {
      const [yearA, weekA] = a.split("-").map(Number);
      const [yearB, weekB] = b.split("-").map(Number);
      if (yearA === yearB) return weekA - weekB;
      return yearA - yearB;
    });

    // Calcul du streak maximal hebdomadaire
    let longestStreak = 0;
    let currentStreak = 1;
    for (let i = 1; i < weeks.length; i++) {
      const [prevYear, prevWeek] = weeks[i - 1].split("-").map(Number);
      const [currYear, currWeek] = weeks[i].split("-").map(Number);

      let isConsecutive = false;
      if (currYear === prevYear) {
        isConsecutive = currWeek === prevWeek + 1;
      } else if (currYear === prevYear + 1) {
        // Si la dernière semaine de l'année précédente est 52 ou 53 et la première de l'année suivante est 1
        if ((prevWeek === 52 || prevWeek === 53) && currWeek === 1) {
          isConsecutive = true;
        }
      }

      if (isConsecutive) {
        currentStreak++;
      } else {
        longestStreak = Math.max(longestStreak, currentStreak);
        currentStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, currentStreak);

    const embed = new EmbedBuilder()
      .setColor(colorEmbed)
      .setTitle("Série Hebdomadaire")
      .setThumbnail(thumbnailEmbed)
      .setDescription(
        `Le plus long streak hebdomadaire de <@${targetUser.id}> est de **${longestStreak} semaines consécutives**.`,
      )
      .setFooter({
        text: `Statistiques BasicFit de ${targetUser.username} du ${jsonDate}`,
      });

    return interaction.reply({ embeds: [embed] });
  },
};
