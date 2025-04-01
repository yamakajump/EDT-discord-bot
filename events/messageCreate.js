/**
 * Gestionnaire de l'événement "messageCreate".
 *
 * Ce module effectue deux opérations principales :
 *  1. Il contrôle les messages envoyés dans des threads (issus d'un forum) pour s'assurer que seuls
 *     l'auteur du fil ou un membre avec le rôle "Coach" peuvent y répondre.
 *     En cas de non-respect, le message est supprimé et une notification temporaire est envoyée.
 *
 *  2. Pour tous les messages (non-bot), il incrémente un compteur associé à chaque auteur via le DAO Nouveau Guerrier.
 *
 * La configuration (IDs de forum, rôle "Coach", etc.) est chargée depuis le fichier de configuration (config.json).
 */

const config = require("../config/config.json");
const guerrierDAO = require("../dao/guerrierDAO"); // Importation du DAO pour gérer le compteur du Nouveau Guerrier

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

    // Contrôle pour les messages envoyés dans un thread rattaché à un forum spécifique
    if (
      message.channel.isThread() &&
      config.forums.includes(message.channel.parentId)
    ) {
      // Vérification : Seul l'auteur du fil (message.channel.ownerId) ou les membres ayant le rôle Coach peuvent répondre
      if (
        message.channel.ownerId !== message.author.id &&
        !message.member.roles.cache.has(config.coachRole)
      ) {
        try {
          // Suppression du message non autorisé
          await message.delete();

          // Envoi d'une notification dans le thread pour informer l'auteur (et éventuellement les autres)
          const warning = await message.channel.send({
            content: `<@${message.author.id}> Seuls l'auteur du post et les personnes ayant le rôle Coach peuvent répondre dans ce forum.`,
          });

          // Suppression de la notification après 1 minute (60000 ms)
          setTimeout(async () => {
            try {
              await warning.delete();
            } catch (err) {
              console.error(
                "Erreur lors de la suppression du message de notification :",
                err,
              );
            }
          }, 60000);
        } catch (err) {
          console.error(
            "Erreur lors de la suppression ou de la gestion du message :",
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
        "Erreur lors de la mise à jour du compteur du Nouveau Guerrier :",
        err,
      );
    }
  },
};
