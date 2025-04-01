// dao/guerrierDAO.js

/**
 * Ce module gère les opérations CRUD concernant la table "guerrier".
 * Il utilise un pool de connexions MySQL promisifié (promisePool) pour effectuer des requêtes.
 *
 * Fonctions proposées :
 *   - getById(id) : Récupère les données d'un guerrier par son identifiant.
 *   - create(id, username) : Crée un enregistrement pour un guerrier avec un compteur initialisé à 1.
 *   - updateCount(id, count) : Met à jour le compteur de messages pour un membre.
 *   - incrementCount(id, username) : Incrémente le compteur de messages ou crée l'enregistrement s'il n'existe pas.
 */

const { promisePool } = require("../utils/dbInit");

module.exports = {
  /**
   * Récupère les informations d'un guerrier par son identifiant.
   *
   * @param {string} id - L'ID du membre.
   * @returns {Promise<Object|undefined>} Un objet représentant la ligne correspondant à l'ID ou undefined s'il n'existe pas.
   */
  getById: async (id) => {
    const [rows] = await promisePool.query(
      `SELECT id, username, count, display_stats, date FROM guerrier WHERE id = ?`,
      [id],
    );
    return rows[0];
  },

  /**
   * Crée une nouvelle fiche pour un guerrier.
   *
   * L'enregistrement est créé avec les informations suivantes :
   *   - id : L'identifiant du membre.
   *   - username : Le nom d'utilisateur.
   *   - count : Initialisé à 1.
   *
   * La colonne 'display_stats' est gérée par défaut par MySQL (valeur false / 0).
   * La colonne 'date' (dernière activité) est gérée automatiquement.
   *
   * @param {string} id - L'ID du membre.
   * @param {string} username - Le nom d'utilisateur.
   * @returns {Promise<number>} L'identifiant de l'insertion (insertId) retourné par MySQL.
   */
  create: async (id, username) => {
    const [result] = await promisePool.query(
      `INSERT INTO guerrier (id, username, count) VALUES (?, ?, ?)`,
      [id, username, 1],
    );
    return result.insertId;
  },

  /**
   * Met à jour le compteur de messages d'un guerrier existant.
   *
   * La colonne 'date' sera automatiquement mise à jour grâce à la clause ON UPDATE CURRENT_TIMESTAMP.
   *
   * @param {string} id - L'ID du membre.
   * @param {number} count - La nouvelle valeur du compteur.
   * @returns {Promise<void>}
   */
  updateCount: async (id, count) => {
    await promisePool.query(`UPDATE guerrier SET count = ? WHERE id = ?`, [
      count,
      id,
    ]);
  },

  /**
   * Incrémente le compteur de messages pour un membre.
   *
   * Si le membre existe déjà, le compteur est incrémenté de 1. Sinon, une nouvelle fiche est créée
   * avec le compteur initialisé à 1. La colonne 'display_stats' reste à sa valeur par défaut (false)
   * et 'date' est gérée automatiquement par MySQL.
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
      return module.exports.create(id, username);
    }
  },

  /**
   * Met à jour la visibilité des statistiques d'un guerrier.
   *
   * @param {string} id - L'ID du membre.
   * @param {boolean} display - La nouvelle valeur pour afficher ou masquer les statistiques.
   * @returns {Promise<void>}
   */
  updateDisplayStats: async (id, display) => {
    await promisePool.query(
      `UPDATE guerrier SET display_stats = ? WHERE id = ?`,
      [display, id],
    );
  },

  /**
   * Récupère la visibilité des statistiques d'un guerrier.
   *
   * @param {string} id - L'ID du membre.
   * @returns {Promise<boolean>} La valeur de la colonne 'display_stats'.
   */
  getDisplayStats: async (id) => {
    const [rows] = await promisePool.query(
      `SELECT display_stats FROM guerrier WHERE id = ?`,
      [id],
    );
    return rows[0]?.display_stats || false;
  },
};
