/**
 * Gestionnaire de l'événement "messageCreate".
 *
 * Ce module effectue trois opérations principales :
 *  1. Il contrôle les messages envoyés dans des threads (issus d'un forum) pour s'assurer que seuls
 *     l'auteur du fil ou un membre avec le rôle "Coach" peuvent y répondre.
 *     En cas de non-respect, le message est supprimé et une notification temporaire est envoyée.
 *
 *  2. Pour tous les messages (non-bot), il incrémente un compteur associé à chaque auteur via le DAO Nouveau Guerrier.
 *
 *  3. Il gère les messages envoyés dans le salon de présentation. Si un membre envoie un message,
 *
 * La configuration (IDs de forum, rôle "Coach", etc.) est chargée depuis le fichier de configuration (config.json).
 */

const guerrierDAO = require("../dao/guerrierDAO"); // Importation du DAO pour gérer le compteur du Nouveau Guerrier

const config = require("../config/config.json");
const forums = config.forums;
const coachRole = config.coachRole;
const presentationChannel = config.presentationChannel;
const nonPresenteRole = config.nonPresenteRole;

module.exports = {
  name: "messageCreate",
  /**
   * Exécute le gestionnaire lors de la création d'un message.
   *
   * @param {Message} message - Le message envoyé sur le serveur.
   */
  async execute(message) {
    // Ignorer les messages des bots
    if (message.author.bot) return;

    // Gestion des messages dans le salon de présentation
    if (message.channel.id === presentationChannel) {
      try {
        // Si le membre possède le rôle "nonPrésente", on le retire
        if (message.member.roles.cache.has(nonPresenteRole)) {
          await message.member.roles.remove(nonPresenteRole);
          console.log(
            `🙋\x1b[38;5;2mLe  rôle non-présent a été retiré à ${message.guild.members.cache.get(message.author.id)?.displayName || message.author.username} suite à l'envoi d'un message dans le canal de présentation.\x1b[0m`,
          );
        }
      } catch (err) {
        console.error(
          "⚠️\x1b[38;5;1m  Erreur lors de la suppression du rôle nonPrésente dans le salon de présentation :",
          err,
        );
      }
    }

    // Contrôle pour les messages envoyés dans un thread rattaché à un forum spécifique
    if (
      message.channel.isThread() &&
      forums.includes(message.channel.parentId)
    ) {
      // Vérification : Seul l'auteur du fil (message.channel.ownerId) ou les membres ayant le rôle Coach peuvent répondre
      if (
        message.channel.ownerId !== message.author.id &&
        !message.member.roles.cache.has(coachRole)
      ) {
        try {
          // Suppression du message non autorisé
          await message.delete();

          // Envoi d'une notification dans le thread pour informer l'auteur (et éventuellement les autres)
          const warning = await message.channel.send({
            content: `<@${message.author.id}> Seuls l'auteur du post et les personnes ayant le rôle Coach peuvent répondre dans ce forum.`,
          });

          console.log(
            `\x1b[38;5;5m🛑  Message de ${message.guild.members.cache.get(message.author.id)?.displayName || message.author.username} supprimé dans le forum : \x1b[38;5;13m${message.channel.name} \x1b[0m`,
          );

          // Suppression de la notification après 1 minute (60000 ms)
          setTimeout(async () => {
            try {
              await warning.delete();
            } catch (err) {
              console.error(
                "⚠️\x1b[38;5;1m  Erreur lors de la suppression du message de notification :",
                err,
              );
            }
          }, 60000);
        } catch (err) {
          console.error(
            "⚠️\x1b[38;5;1m  Erreur lors de la suppression ou de la gestion du message :",
            err,
          );
        }
      }
    }

    // Incrémentation du compteur associé au Nouveau Guerrier pour chaque message (pour toutes les discussions)
    try {
      await guerrierDAO.incrementCount(
        message.author.id,
        message.author.username,
      );
    } catch (err) {
      console.error(
        "⚠️\x1b[38;5;1m  Erreur lors de la mise à jour du compteur du Nouveau Guerrier :",
        err,
      );
    }
  },
};
