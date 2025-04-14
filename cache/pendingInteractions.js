// cache/pendingInteractions.js

// Ce module gère un cache simple pour stocker les contextes d'interactions en attente.
// On utilise une Map où la clé est l'ID de l'utilisateur.
const pendingInteractions = new Map();

/**
 * Ajoute ou met à jour le contexte d'une interaction en attente.
 *
 * @param {string} userId - L'ID de l'utilisateur.
 * @param {object} context - Le contexte à sauvegarder.
 */
function add(userId, context) {
  pendingInteractions.set(userId, context);
}

/**
 * Récupère le contexte d'une interaction en attente.
 *
 * @param {string} userId - L'ID de l'utilisateur.
 * @returns {object|undefined} Le contexte associé ou undefined s'il n'existe pas.
 */
function get(userId) {
  return pendingInteractions.get(userId);
}

/**
 * Supprime le contexte d'une interaction en attente.
 *
 * @param {string} userId - L'ID de l'utilisateur.
 * @returns {boolean} true si la suppression a réussi, false sinon.
 */
function remove(userId) {
  return pendingInteractions.delete(userId);
}

/**
 * Retourne le contenu complet de la Map (au cas où vous auriez besoin de parcourir ou debugger).
 *
 * @returns {Map} La Map contenant toutes les interactions en attente.
 */
function getAll() {
  return pendingInteractions;
}

module.exports = {
  add,
  get,
  remove,
  getAll,
};
