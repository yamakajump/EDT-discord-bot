// dao/basicFitStatsDAO.js

/**
 * Ce module gère les opérations CRUD concernant la table "basicfit_stats".
 * Chaque enregistrement correspond aux statistiques JSON d'un guerrier.
 *
 * Fonctions proposées :
 *   - getStatsByGuerrierId(guerrierId) : Récupère les statistiques d'un guerrier.
 *   - createStats(guerrierId, stats) : Crée un nouvel enregistrement de stats.
 *   - updateStats(guerrierId, stats) : Met à jour les statistiques existantes.
 *   - upsertStats(guerrierId, stats, username) : Crée ou met à jour les statistiques d'un guerrier.
 *      Si le guerrier n'existe pas dans la table "guerrier", il est créé avec le username fourni.
 */

const { promisePool } = require("../utils/dbInit");
const guerrierDAO = require("./guerrierDAO");

module.exports = {
  /**
   * Récupère les statistiques Basic Fit d'un guerrier par son ID.
   *
   * @param {string} guerrierId - L'ID du guerrier.
   * @returns {Promise<Object|undefined>} Un objet représentant les stats ou undefined s'il n'existe pas.
   */
  getStatsByGuerrierId: async (guerrierId) => {
    const [rows] = await promisePool.query(
      `SELECT guerrier_id, stats, derniere_modification FROM basicfit_stats WHERE guerrier_id = ?`,
      [guerrierId],
    );
    return rows[0];
  },

  /**
   * Récupère la date de la dernière modification des statistiques d'un guerrier.
   * 
   * @param {string} guerrierId - L'ID du guerrier.
   * @returns {Promise<Date|undefined>} La date de la dernière modification ou undefined si aucune donnée n'est trouvée.
   */
  getLastModifiedDate: async (guerrierId) => {
    const [rows] = await promisePool.query(
      `SELECT derniere_modification FROM basicfit_stats WHERE guerrier_id = ?`,
      [guerrierId],
    );
    return rows[0] ? new Date(rows[0].derniere_modification) : undefined;
  },

  /**
   * Crée un nouvel enregistrement pour les statistiques d'un guerrier.
   *
   * La colonne 'derniere_modification' est gérée automatiquement par MySQL.
   *
   * @param {string} guerrierId - L'ID du guerrier.
   * @param {Object} stats - Un objet JSON contenant les statistiques.
   * @returns {Promise<number>} L'identifiant d'insertion retourné par MySQL.
   */
  createStats: async (guerrierId, stats) => {
    const [result] = await promisePool.query(
      `INSERT INTO basicfit_stats (guerrier_id, stats) VALUES (?, ?)`,
      [guerrierId, JSON.stringify(stats)],
    );
    return result.insertId;
  },

  /**
   * Met à jour les statistiques d'un guerrier existant.
   *
   * La colonne 'derniere_modification' sera automatiquement mise à jour grâce à la clause ON UPDATE CURRENT_TIMESTAMP.
   *
   * @param {string} guerrierId - L'ID du guerrier.
   * @param {Object} stats - Un objet JSON avec les nouvelles statistiques.
   * @returns {Promise<void>}
   */
  updateStats: async (guerrierId, stats) => {
    await promisePool.query(
      `UPDATE basicfit_stats SET stats = ? WHERE guerrier_id = ?`,
      [JSON.stringify(stats), guerrierId],
    );
  },

  /**
   * Crée ou met à jour les statistiques d'un guerrier.
   *
   * Avant la mise à jour ou la création, la fonction vérifie que le guerrier existe
   * dans la table "guerrier". S'il n'existe pas, il est créé avec le username fourni.
   *
   * @param {string} guerrierId - L'ID du guerrier.
   * @param {Object} stats - Un objet JSON contenant les statistiques.
   * @param {string} username - Le nom d'utilisateur pour créer le guerrier s'il n'existe pas.
   * @returns {Promise<void>}
   */
  upsertStats: async (guerrierId, stats, username = "Inconnu") => {
    // Vérifier l'existence du guerrier et le créer si besoin
    const guerrier = await guerrierDAO.getById(guerrierId);
    if (!guerrier) {
      await guerrierDAO.create(guerrierId, username);
    }

    const existing = await module.exports.getStatsByGuerrierId(guerrierId);
    if (existing) {
      return module.exports.updateStats(guerrierId, stats);
    } else {
      return module.exports.createStats(guerrierId, stats);
    }
  },

  /**
   * Vérifie si un guerrier a des statistiques enregistrées.
   *
   * @param {string} guerrierId - L'ID du guerrier.
   * @returns {Promise<boolean>} True si des statistiques existent, sinon false.
   */
  hasStats: async (guerrierId) => {
    const stats = await module.exports.getStatsByGuerrierId(guerrierId);
    return !!stats;
  },
};
