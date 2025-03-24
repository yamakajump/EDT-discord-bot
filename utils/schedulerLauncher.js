/**
 * Ce module charge automatiquement tous les fichiers de la
 * dossier 'scheduler' (situé à la racine du projet) et exécute
 * leur fonction d'ordonnancement (scheduleMessages) si elle est présente.
 *
 * Chaque fichier doit se terminer par '.js' et exporter une fonction
 * nommée scheduleMessages qui prend en paramètre le client Discord.
 */

const fs = require("fs");
const path = require("path");

module.exports = (client) => {
  // Obtient le chemin complet du dossier scheduler (un niveau au-dessus du dossier utils)
  const schedulerPath = path.join(__dirname, "..", "scheduler");

  // Lit le contenu du dossier 'scheduler'
  fs.readdirSync(schedulerPath).forEach((file) => {
    // Ne traiter que les fichiers JavaScript
    if (file.endsWith(".js")) {
      // Construit le chemin complet vers le fichier
      const scheduler = require(path.join(schedulerPath, file));

      // Vérifie si le module exporte bien une fonction "scheduleMessages"
      if (typeof scheduler.scheduleMessages === "function") {
        // Exécute cette fonction en lui passant le client Discord
        scheduler.scheduleMessages(client);
        console.log(`Scheduler chargé : ${file}`);
      } else {
        console.warn(
          `Le fichier ${file} ne contient pas de fonction scheduleMessages.`,
        );
      }
    }
  });
};
