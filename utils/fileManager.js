/**
 * Module utilitaire pour la gestion de fichiers JSON.
 *
 * Fournit des fonctions pour charger et sauvegarder des fichiers JSON.
 * Si le fichier n'existe pas lors du chargement, il est créé avec une valeur par défaut.
 */

const fs = require("fs");
const path = require("path");

/**
 * Charge un fichier JSON en le parsant.
 *
 * Si le fichier n'existe pas, il est créé avec la valeur par défaut fournie.
 *
 * @param {string} filePath - Chemin du fichier à charger.
 * @param {Object} defaultValue - Valeur par défaut à utiliser si le fichier n'existe pas.
 * @returns {Object} Contenu du fichier JSON ou la valeur par défaut en cas d'erreur.
 */
function loadJson(filePath, defaultValue = {}) {
  try {
    // Vérifie si le fichier existe
    if (!fs.existsSync(filePath)) {
      // Si le fichier n'existe pas, sauvegarde la valeur par défaut
      saveJson(filePath, defaultValue);
      return defaultValue;
    }

    // Lit le contenu brut du fichier JSON
    const rawData = fs.readFileSync(filePath, "utf-8");
    // Retourne l'objet JSON parsé
    return JSON.parse(rawData);
  } catch (error) {
    console.error(
      `Erreur lors du chargement du fichier JSON : ${filePath}`,
      error,
    );
    // En cas d'erreur, retourne la valeur par défaut pour éviter l'interruption du programme
    return defaultValue;
  }
}

/**
 * Sauvegarde un objet dans un fichier JSON.
 *
 * Crée le dossier parent si nécessaire.
 *
 * @param {string} filePath - Chemin du fichier à sauvegarder.
 * @param {Object} data - Données à sauvegarder.
 */
function saveJson(filePath, data) {
  try {
    // Récupère le chemin du dossier contenant le fichier
    const dir = path.dirname(filePath);

    // Crée le dossier s'il n'existe pas (option recursive pour créer tous les dossiers intermédiaires)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Écrit les données dans le fichier en format JSON avec une indentation de 4 espaces pour la lisibilité
    fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
  } catch (error) {
    console.error(
      `Erreur lors de la sauvegarde du fichier JSON : ${filePath}`,
      error,
    );
  }
}

module.exports = {
  loadJson,
  saveJson,
};
