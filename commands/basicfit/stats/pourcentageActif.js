const { EmbedBuilder, MessageFlags } = require("discord.js");
const { getEmoji } = require("../../../utils/emoji");

module.exports = {
  /**
   * Exécute la commande Active Percentage.
   *
   * @param {Object} interaction - L'interaction Discord.
   * @param {Object} [targetUser] - L'utilisateur cible. Si non fourni, il est récupéré via interaction.options.
   * @param {Object} [jsonData] - Les données JSON des statistiques. Si non fourni, un message d'erreur est renvoyé.
   * @param {string} jsonDate - La date associée aux statistiques.
   */
  async execute(interaction, targetUser, jsonData, jsonDate) {

    // Récupération des visites et transformation en objet Date
    const visitsActive = jsonData.visits.map((entry) => {
      const [day, month, year] = entry.date.split("-");
      return new Date(`${year}-${month}-${day}`);
    });

    // S'il n'y a aucune visite enregistrée
    if (!visitsActive.length) {

        const emojiInfo = getEmoji("info");

      const noVisitEmbed = new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle("Activité en pourcentage")
        .setThumbnail("https://i.ibb.co/Y795qQQd/logo-EDT.png")
        .setDescription(
          `${emojiInfo} Aucune visite enregistrée pour **${targetUser.username}**.`
        )
        .setFooter({ text: `Statistiques BasicFit de ${targetUser.username} du ${jsonDate}` });
      return interaction.reply({
        embeds: [noVisitEmbed],
        flags: MessageFlags.Ephemeral,
      });
    }

    // Tri des visites et calcul de la période totale
    const sortedVisits = visitsActive.sort((a, b) => a - b);
    const firstVisit = sortedVisits[0];
    const lastVisit = sortedVisits[sortedVisits.length - 1];
    const totalDays =
      Math.ceil((lastVisit - firstVisit) / (1000 * 60 * 60 * 24)) + 1;
    const uniqueActiveDays = new Set(
      sortedVisits.map((date) => date.toDateString())
    ).size;
    const activePercentage = ((uniqueActiveDays / totalDays) * 100).toFixed(2);

    const emojiCible = getEmoji("cible");

    // Création de l'Embed et réponse à l'interaction
    const activePercentageEmbed = new EmbedBuilder()
      .setColor("#FFA500")
      .setTitle("Activité en pourcentage")
      .setThumbnail("https://i.ibb.co/Y795qQQd/logo-EDT.png")
      .setDescription(
        `${emojiCible} **Activité en pourcentage** : <@${targetUser.id}> a été actif ` +
        `**${activePercentage}%** des jours sur la période totale ` +
        `(${uniqueActiveDays} jours actifs sur ${totalDays} jours).`
      )
      .setFooter({ text: `Statistiques BasicFit de ${targetUser.username} du ${jsonDate}` })

    return interaction.reply({ embeds: [activePercentageEmbed] });
  },
};
