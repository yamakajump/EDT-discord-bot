const config = require('../config/config.json');

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    // On ignore les messages des bots
    if (message.author.bot) return;

    // Vérifier que le message est envoyé dans un thread d'un forum
    if (message.channel.isThread() && config.forums.includes(message.channel.parentId)) {
      // Vérifier si l'auteur du message est bien l'auteur du fil ou possède le rôle Coach
      if (message.channel.ownerId !== message.author.id && !message.member.roles.cache.has(config.coachRole)) {
        try {
          // Supprime le message non autorisé
          await message.delete();

          // Envoie un message de notification dans le thread
          const warning = await message.channel.send({
            content: `<@${message.author.id}> Seuls l'auteur du post et les personnes ayant le rôle Coach peuvent répondre dans ce forum.`
          });

          // Supprime le message de notification après 1 minute (60000 ms)
          setTimeout(async () => {
            try {
              await warning.delete();
            } catch (err) {
              console.error("Erreur lors de la suppression du message de notification :", err);
            }
          }, 60000);

        } catch (err) {
          console.error("Erreur lors de la suppression ou de la gestion du message :", err);
        }
      }
    }
  },
};
