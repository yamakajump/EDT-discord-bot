// dao/nouveauGuerrierDAO.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.db');
// Ouverture de la DB – vous pouvez choisir d'avoir un singleton ou d'ouvrir/fermer selon vos besoins.
const db = new sqlite3.Database(dbPath);

module.exports = {
  /**
   * Récupère les informations d'un Nouveau Guerrier par son ID.
   * @param {string} id L'ID du membre.
   * @returns {Promise<Object>} La ligne correspondante ou undefined.
   */
  getById: (id) => {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT id, username, count, date FROM nouveau_guerrier WHERE id = ?`,
        [id],
        (err, row) => {
          if (err) return reject(err);
          resolve(row);
        }
      );
    });
  },

  /**
   * Crée une nouvelle fiche Nouveau Guerrier.
   * @param {string} id L'ID du membre.
   * @param {string} username Le nom d'utilisateur.
   * @param {string} date La date (au format ISO) du premier message.
   * @returns {Promise<number>} L'ID inséré (selon sqlite).
   */
  create: (id, username, date) => {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO nouveau_guerrier (id, username, count, date)
        VALUES (?, ?, ?, ?)
      `;
      db.run(query, [id, username, 1, date], function (err) {
        if (err) return reject(err);
        resolve(this.lastID);
      });
    });
  },

  /**
   * Met à jour le compteur de messages pour un Nouveau Guerrier.
   * @param {string} id L'ID du membre.
   * @param {number} count Le nouveau compteur.
   * @returns {Promise<void>}
   */
  updateCount: (id, count) => {
    return new Promise((resolve, reject) => {
      db.run(`UPDATE nouveau_guerrier SET count = ? WHERE id = ?`, [count, id], function (err) {
        if (err) return reject(err);
        resolve();
      });
    });
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
      // Lors de la première entrée, on enregistre la date actuelle au format ISO.
      const now = new Date().toISOString();
      return module.exports.create(id, username, now);
    }
  }
};
