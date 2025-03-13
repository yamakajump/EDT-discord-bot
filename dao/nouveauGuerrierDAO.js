// dao/nouveauGuerrierDAO.js
const { promisePool } = require('../utils/dbInit');

module.exports = {
  /**
   * Récupère les informations d'un Nouveau Guerrier par son ID.
   * @param {string} id L'ID du membre.
   * @returns {Promise<Object|undefined>} La ligne correspondante ou undefined.
   */
  getById: async (id) => {
    const [rows] = await promisePool.query(
      `SELECT id, username, count, date FROM nouveau_guerrier WHERE id = ?`,
      [id]
    );
    return rows[0];
  },

  /**
   * Crée une nouvelle fiche Nouveau Guerrier.
   * @param {string} id L'ID du membre.
   * @param {string} username Le nom d'utilisateur.
   * @param {string} date La date (au format ISO) du premier message.
   * @returns {Promise<number>} L'ID inséré (selon MySQL).
   */
  create: async (id, username, date) => {
    const [result] = await promisePool.query(
      `INSERT INTO nouveau_guerrier (id, username, count, date) VALUES (?, ?, ?, ?)`,
      [id, username, 1, date]
    );
    return result.insertId;
  },

  /**
   * Met à jour le compteur de messages pour un Nouveau Guerrier.
   * @param {string} id L'ID du membre.
   * @param {number} count Le nouveau compteur.
   * @returns {Promise<void>}
   */
  updateCount: async (id, count) => {
    await promisePool.query(
      `UPDATE nouveau_guerrier SET count = ? WHERE id = ?`,
      [count, id]
    );
  },

  /**
   * Incrémente le compteur de messages. Si la fiche n'existe pas,
   * elle est créée avec la date du premier message.
   * @param {string} id L'ID du membre.
   * @param {string} username Le nom d'utilisateur.
   * @returns {Promise<void>}
   */
  incrementCount: async (id, username) => {
    const row = await module.exports.getById(id);
    if (row) {
      const newCount = row.count + 1;
      return module.exports.updateCount(id, newCount);
    } else {
      // Lors de la première entrée, on enregistre la date actuelle au format MySQL DATETIME.
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      return module.exports.create(id, username, now);
    }
  },  
};
