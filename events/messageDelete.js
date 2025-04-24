/**
 * Gestionnaire de l'événement "messageDelete" pour le salon de présentation.
 *
 * Ce module surveille la suppression des messages dans le canal de présentation.
 * Si un membre supprime son message de présentation, on lui réattribue le rôle "nonPrésente".
 */
const config = require("../config/config.json");
const presentationChannel = config.presentationChannel;
const nonPresenteRole = config.nonPresenteRole;

module.exports = {
  name: "messageDelete",
  async execute(message) {
    // Ne traite que les messages venant du salon de présentation et ceux des membres (pas de bot)
    if (message.channel.id !== presentationChannel) return;
    if (message.author.bot) return;

    try {
      const member = message.guild.members.cache.get(message.author.id);
      if (member && !member.roles.cache.has(nonPresenteRole)) {
        await member.roles.add(nonPresenteRole);
        console.log(
          `🙋\x1b[38;5;3mLe  rôle non-présent a été réattribué à ${member.displayName} suite à la suppression de son message de présentation.\x1b[0m`,
        );
      }
    } catch (error) {
      console.error(
        "⚠️\x1b[38;5;1m  Erreur lors de l'attribution du rôle nonPrésente suite à la suppression du message de présentation :",
        error,
      );
    }
  },
};
