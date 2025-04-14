// /buttons/updatePhysique.js

const pendingInteractions = require("../cache/pendingInteractions");
const { MessageFlags } = require("discord.js");

module.exports = {
  // Ce handler s'applique aux customId commençant par "updatePhysique:"
  async execute(interaction) {
    const userId = interaction.user.id;
    const pending = pendingInteractions.get(userId);

    if (!pending || pending.type !== "physiqueUpdateConfirmation") {
      return await interaction.reply({
        content:
          "Aucun contexte en attente n'a été trouvé pour cette interaction.",
        flags: MessageFlags.Ephemeral,
      });
    }

    // Récupération de la réponse ("yes" ou "no") via le customId
    const choice = interaction.customId.split(":")[1];
    const updateChoice = choice === "yes";

    // Mise à jour de l'interaction : on efface les boutons et on informe l'utilisateur.
    await interaction.update({
      content: `Vous avez choisi de ${updateChoice ? "mettre à jour" : "conserver"} vos données actuelles.`,
      components: [],
    });

    // Suppression du contexte en attente
    pendingInteractions.remove(userId);

    if (updateChoice) {
      // Si l'utilisateur choisit de mettre à jour ses données,
      // par exemple, on l'informe qu'il doit saisir ses nouvelles données.
      await pending.originalInteraction.followUp({
        content:
          "Veuillez saisir vos nouvelles données via la commande appropriée.",
        flags: MessageFlags.Ephemeral,
      });
    } else {
      // Si l'utilisateur ne souhaite pas mettre à jour, on relance le calcul
      // avec les données stockées dans pending.finalData.
      await pending.executeCalculationCallback(
        pending.originalInteraction,
        pending.finalData,
      );
    }
  },
};
