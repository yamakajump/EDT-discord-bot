/**
 * Gestionnaire de l'événement "ready".
 *
 * Ce module est déclenché une seule fois lorsque le bot est connecté et prêt.
 * Il affiche un message de confirmation dans la console et lance les tâches planifiées (schedulers).
 */

const launchSchedulers = require("../utils/schedulerLauncher");

module.exports = {
  name: "ready",
  once: true,
  /**
   * Méthode exécutée lors du déclenchement de l'événement "ready".
   *
   * @param {Client} client - L'instance du bot Discord.
   */
  async execute(client) {
    console.log(`
  \x1b[38;2;210;130;0m ███████╗█████╗ ████████╗    ██████╗  ██████╗ ████████╗
  \x1b[38;2;205;120;0m ██╔════╝██  ██╗╚══██╔══╝    ██╔══██╗██╔═══██╗╚══██╔══╝
  \x1b[38;2;200;110;0m █████╗  ██  ██║   ██║       ██████╔╝██║   ██║   ██║   
  \x1b[38;2;195;100;0m ██╔══╝  ██  ██║   ██║       ██╔══██╗██║   ██║   ██║   
  \x1b[38;2;190;90;0m ███████╗█████╔╝   ██║       ██████╔╝╚██████╔╝   ██║   
  \x1b[38;2;185;80;0m ╚══════╝ ╚═══╝    ╚═╝       ╚═════╝  ╚═════╝    ╚═╝\x1b[0m
       https://github.com/yamakajump/EDT-discord-bot
`);

    console.log(
      `\x1b[0m🚀 Le bot est prêt ! Connecté en tant que \x1b[38;5;45m${client.user.tag}\x1b[0m (\x1b[38;5;45m${client.user.id}\x1b[0m)`,
    );

    // Lancement des tâches planifiées (schedulers)
    launchSchedulers(client);
  },
};
