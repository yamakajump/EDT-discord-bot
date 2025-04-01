const guerrierDAO = require("../../dao/guerrierDAO");
const { MessageFlags } = require("discord.js");

module.exports = {
  /**
   * Modifie la visibilité des statistiques pour l'utilisateur ayant exécuté la commande.
   * L'option "visibilite" attendue est soit "public" soit "prive".
   *
   * @param {Object} interaction - L'objet Interaction provenant de Discord.js.
   */
  async execute(interaction) {
    // Récupération de l'option de visibilité passée par la commande
    const visibilityOption = interaction.options.getString("visibilite");
    // On considère "public" = true, "prive" = false
    const display = visibilityOption === "public";

    // L'utilisateur ciblé est ici celui qui lance la commande.
    const userId = interaction.user.id;

    try {
      // mise à jour de la visibilité dans la base
      await guerrierDAO.updateDisplayStats(userId, display);
      // Réponse à l'utilisateur pour confirmer le changement
      await interaction.reply({
        content: `La visibilité de vos statistiques a été mise à jour : vos statistiques sont désormais ${display ? "publiques" : "privées"}.`,
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      console.error(
        `Erreur lors de la mise à jour de la visibilité des statistiques pour l'utilisateur ${userId}:`,
        error,
      );
      await interaction.reply({
        content:
          "Une erreur est survenue lors de la mise à jour de la visibilité des statistiques.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
