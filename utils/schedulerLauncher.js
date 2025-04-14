/**
 * Ce module charge automatiquement tous les fichiers du
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

  // Tableau qui contiendra le nom du fichier et son statut
  const tableRows = [];

  // Lecture du contenu du dossier 'scheduler'
  fs.readdirSync(schedulerPath).forEach((file) => {
    // Ne traiter que les fichiers JavaScript
    if (file.endsWith(".js")) {
      // Construit le chemin complet vers le fichier
      const scheduler = require(path.join(schedulerPath, file));

      // Vérifie si le module exporte bien une fonction "scheduleMessages"
      let status = "";
      if (typeof scheduler.scheduleMessages === "function") {
        // Exécute la fonction en lui passant le client Discord
        scheduler.scheduleMessages(client);
        status = "Chargé";
      } else {
        status = "Erreur : fonction manquante";
      }
      tableRows.push({ Fichier: file, Statut: status });
    }
  });

  // Affichage du tableau stylisé
  console.log("\n\x1b[1m📅  Liste des schedulers :\x1b[0m");

  // Détermine la largeur maximale de chaque colonne
  const headerFichier = "Fichier";
  const headerStatut = "Statut";
  let maxFichierWidth = headerFichier.length;
  let maxStatutWidth = headerStatut.length;

  tableRows.forEach((row) => {
    if (row.Fichier.length > maxFichierWidth)
      maxFichierWidth = row.Fichier.length;
    if (row.Statut.length > maxStatutWidth) maxStatutWidth = row.Statut.length;
  });

  // Création des lignes de séparation du tableau
  const horizontalLineTop = `┌${"─".repeat(maxFichierWidth + 2)}┬${"─".repeat(maxStatutWidth + 2)}┐`;
  const horizontalLineMiddle = `├${"─".repeat(maxFichierWidth + 2)}┼${"─".repeat(maxStatutWidth + 2)}┤`;
  const horizontalLineBottom = `└${"─".repeat(maxFichierWidth + 2)}┴${"─".repeat(maxStatutWidth + 2)}┘`;

  // Ligne d'entête
  const headerRow = `│ ${headerFichier.padEnd(maxFichierWidth)} │ ${headerStatut.padEnd(maxStatutWidth)} │`;

  // Affichage du tableau
  console.log(horizontalLineTop);
  console.log(headerRow);
  console.log(horizontalLineMiddle);

  tableRows.forEach((row) => {
    // Applique une couleur au statut : vert pour "Chargé", jaune pour une erreur.
    let statutAffichage = row.Statut;
    if (row.Statut === "Chargé") {
      statutAffichage = `\x1b[32m${row.Statut}\x1b[0m`;
    } else {
      statutAffichage = `\x1b[31m${row.Statut}\x1b[0m`;
    }

    // Affichage de la ligne du tableau
    console.log(
      `│ ${row.Fichier.padEnd(maxFichierWidth)} │ ${statutAffichage.padEnd(maxStatutWidth + 9)} │`,
    );
    // (Note : "+ 9" est ajouté pour compenser la longueur des codes d'échappement ANSI)
  });

  console.log(horizontalLineBottom);
};
