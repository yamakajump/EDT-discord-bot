/**
 * Gestionnaire de l'événement "ready".
 *
 * Ce module est déclenché une seule fois lorsque le bot est connecté et prêt.
 * Il affiche un message de confirmation dans la console et lance les tâches planifiées (schedulers).
 */

const launchSchedulers = require('../utils/schedulerLauncher');

module.exports = {
  name: 'ready',  // Nom de l'événement associé
  once: true,     // Indique que cet événement sera exécuté une seule fois
  /**
   * Méthode exécutée lors du déclenchement de l'événement "ready".
   *
   * @param {Client} client - L'instance du bot Discord.
   */
  async execute(client) {
    // Affichage d'un message de confirmation dans la console
    console.log(`Connecté en tant que ${client.user.tag}`);

    // Lancement des tâches planifiées (schedulers)
    launchSchedulers(client);
  },
};
