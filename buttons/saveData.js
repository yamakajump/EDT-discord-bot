// /buttons/saveData.js

const pendingInteractions = require("../cache/pendingInteractions");
const guerrierDAO = require("../dao/guerrierDAO");
const { MessageFlags } = require("discord.js");

module.exports = {
  // Ce handler s'applique aux customId commençant par "saveData:"
  async execute(interaction) {
    // Extraction des paramètres depuis le customId au format "saveData:yes:<userId>" ou "saveData:no:<userId>"
    const [prefix, choice, customUserId] = interaction.customId.split(":");

    // Vérification que l'ID contenu dans le customId correspond à celui de l'utilisateur qui a cliqué
    if (interaction.user.id !== customUserId) {
      return await interaction.reply({
        content: "Vous n'êtes pas autorisé à utiliser ce bouton.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const userId = interaction.user.id;
    const pending = pendingInteractions.get(userId);

    if (!pending || pending.type !== "physiqueConfirmation") {
      return await interaction.reply({
        content:
          "Aucun contexte en attente n'a été trouvé pour cette interaction.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const enregistrerChoice = choice === "yes";

    // Mise à jour de la préférence d'enregistrement en base pour cet utilisateur via le DAO
    await guerrierDAO.updateEnregistrer(userId, enregistrerChoice);

    // Si l'utilisateur a choisi "Oui", on enregistre également les données fournies (providedData)
    if (enregistrerChoice) {
      await guerrierDAO.updateUserData(userId, pending.providedData);
    }

    // Optionnel : mettre à jour l'objet contextuel si nécessaire
    pending.guerrier.enregistrer = enregistrerChoice;

    // Supprimer le contexte en attente
    pendingInteractions.remove(userId);

    // Relancer la commande en appelant le callback avec les données fournies
    await pending.executeCalculationCallback(
      pending.originalInteraction,
      pending.providedData,
    );
  },
};
