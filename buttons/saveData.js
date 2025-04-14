// /buttons/saveData.js

const pendingInteractions = require("../cache/pendingInteractions");
const guerrierDAO = require("../dao/guerrierDAO");
const { MessageFlags } = require("discord.js");

module.exports = {
  // Ce handler s'applique aux customId commençant par "saveData:"
  async execute(interaction) {
    const userId = interaction.user.id;
    const pending = pendingInteractions.get(userId);

    if (!pending || pending.type !== "physiqueConfirmation") {
      return await interaction.reply({
        content:
          "Aucun contexte en attente n'a été trouvé pour cette interaction.",
        flags: MessageFlags.Ephemeral,
      });
    }

    // Récupération de la réponse ("yes" ou "no") via le customId
    const choice = interaction.customId.split(":")[1];
    const enregistrerChoice = choice === "yes";

    // Mettez à jour la valeur "enregistrer" en base pour cet utilisateur
    await guerrierDAO.updateEnregistrer(userId, enregistrerChoice);

    // Optionnel : mettre à jour l'objet contextuel si nécessaire
    pending.guerrier.enregistrer = enregistrerChoice;

    // Supprimer le contexte en attente
    pendingInteractions.remove(userId);

    // Notifier l'utilisateur et supprimer les boutons
    await interaction.update({
      content: `Vos données seront ${enregistrerChoice ? "" : "non "}enregistrées.`,
      components: [],
    });

    // Relancer la commande en appelant le callback avec les données fournies
    await pending.executeCalculationCallback(
      pending.originalInteraction,
      pending.providedData,
    );
  },
};
