// dao/nouveauGuerrierDAO.js

/**
 * Ce module gère les opérations CRUD concernant la table "nouveau_guerrier".
 * Il utilise un pool de connexions MySQL promisifié (promisePool) pour effectuer des requêtes.
 *
 * Fonctions proposées :
 *   - getById(id) : Récupère les données d'un nouveau guerrier par son identifiant.
 *   - create(id, username, date) : Crée un enregistrement pour un nouveau guerrier avec un compteur initialisé à 1.
 *   - updateCount(id, count) : Met à jour le compteur de messages pour un membre.
 *   - incrementCount(id, username) : Incrémente le compteur de messages ou crée l'enregistrement s'il n'existe pas.
 */

const { promisePool } = require("../utils/dbInit");

module.exports = {
  /**
   * Récupère les informations d'un nouveau guerrier par son identifiant.
   *
   * @param {string} id - L'ID du membre.
   * @returns {Promise<Object|undefined>} Un objet représentant la ligne correspondant à l'ID ou undefined s'il n'existe pas.
   */
  getById: async (id) => {
    const [rows] = await promisePool.query(
      `SELECT id, username, count, date FROM nouveau_guerrier WHERE id = ?`,
      [id],
    );
    return rows[0];
  },

  /**
   * Crée une nouvelle fiche pour un nouveau guerrier.
   *
   * L'enregistrement est créé avec les informations suivantes :
   *   - id : L'identifiant du membre.
   *   - username : Le nom d'utilisateur.
   *   - count : Initialisé à 1 (premier message).
   *   - date : La date du premier message sous forme de chaîne de caractères (format ISO / MySQL DATETIME).
   *
   * @param {string} id - L'ID du membre.
   * @param {string} username - Le nom d'utilisateur.
   * @param {string} date - La date du premier message (format ISO ou DATETIME MySQL).
   * @returns {Promise<number>} L'identifiant de l'insertion (insertId) retourné par MySQL.
   */
  create: async (id, username, date) => {
    const [result] = await promisePool.query(
      `INSERT INTO nouveau_guerrier (id, username, count, date) VALUES (?, ?, ?, ?)`,
      [id, username, 1, date],
    );
    return result.insertId;
  },

  /**
   * Met à jour le compteur de messages d'un nouveau guerrier existant.
   *
   * @param {string} id - L'ID du membre.
   * @param {number} count - La nouvelle valeur du compteur.
   * @returns {Promise<void>}
   */
  updateCount: async (id, count) => {
    await promisePool.query(
      `UPDATE nouveau_guerrier SET count = ? WHERE id = ?`,
      [count, id],
    );
  },

  /**
   * Incrémente le compteur de messages pour un membre.
   *
   * Si le membre existe déjà, le compteur est incrémenté de 1. Sinon, une nouvelle fiche est créée
   * avec le compteur initialisé à 1 et la date du premier message enregistrée (date actuelle).
   *
   * @param {string} id - L'ID du membre.
   * @param {string} username - Le nom d'utilisateur.
   * @returns {Promise<void>}
   */
  incrementCount: async (id, username) => {
    const row = await module.exports.getById(id);
    if (row) {
      const newCount = row.count + 1;
      return module.exports.updateCount(id, newCount);
    } else {
      // Lorsqu'un nouveau guerrier est détecté, on enregistre la date actuelle sous le format MySQL DATETIME.
      const now = new Date().toISOString().slice(0, 19).replace("T", " ");
      return module.exports.create(id, username, now);
    }
  },
};
