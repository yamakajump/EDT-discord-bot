// dao/guerrierDAO.js

/**
 * Ce module gère les opérations CRUD concernant la table "guerrier".
 * Il utilise un pool de connexions MySQL promisifié (promisePool) pour effectuer des requêtes.
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
      `SELECT id, username, count, display_stats, enregistrer, rappel_update_physique,
              poids, taille, age, sexe, activite, jours, temps, intensite, tef, derniere_modification 
       FROM guerrier 
       WHERE id = ?`,
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
   * La colonne 'display_stats' est gérée par défaut par MySQL (valeur false / 0)
   * et 'enregistrer' reste à NULL par défaut.
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
   * La colonne 'derniere_activite' sera automatiquement mise à jour grâce à la clause ON UPDATE CURRENT_TIMESTAMP.
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
   * et 'derniere_activite' est gérée automatiquement par MySQL.
   *
   * @param {string} id - L'ID du membre.
   * @param {string} username - Le nom d'utilisateur.
   * @param {number} rappel_update_physique - La durée de rappel par défaut à utiliser en cas de création.
   * @returns {Promise<void>}
   */
  incrementCount: async (id, username, rappel_update_physique = 4) => {
    const row = await module.exports.getById(id);
    if (row) {
      const newCount = row.count + 1;
      await module.exports.updateCount(id, newCount);
    } else {
      await module.exports.create(id, username, rappel_update_physique);
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

  /**
   * Met à jour les données physiques d'un guerrier.
   *
   * @param {string} id - L'ID du membre.
   * @param {object} data - Un objet contenant les champs à mettre à jour.
   * @param {number|null} data.poids - Poids en kg.
   * @param {number|null} data.taille - Taille en cm.
   * @param {number|null} data.age - Âge en années.
   * @param {string|null} data.sexe - 'H' ou 'F'.
   * @param {string|null} data.activite - Niveau d'activité.
   * @param {number|null} data.jours - Jours d'entraînement par semaine.
   * @param {number|null} data.temps - Temps d'entraînement quotidien en minutes.
   * @param {string|null} data.intensite - Intensité de l'entraînement.
   * @param {number|null} data.tef - TEF.
   * @returns {Promise<void>}
   */
  updateUserData: async (id, data) => {
    let { poids, taille, age, sexe, activite, jours, temps, intensite, tef } =
      data;

    // Si la donnée 'sexe' est présente, on conserve uniquement la première lettre en majuscule.
    // Ainsi, "homme" deviendra "H" et "femme" deviendra "F".
    if (sexe) {
      sexe = sexe.trim().toUpperCase().charAt(0);
    }

    await promisePool.query(
      `UPDATE guerrier 
       SET poids = ?, taille = ?, age = ?, sexe = ?, activite = ?, jours = ?, temps = ?, intensite = ?, tef = ? 
       WHERE id = ?`,
      [poids, taille, age, sexe, activite, jours, temps, intensite, tef, id],
    );
  },

  /**
   * Met à jour la préférence d'enregistrement des données physiques d'un guerrier.
   *
   * @param {string} id - L'ID du membre.
   * @param {boolean} enregistrer - La valeur souhaitée pour enregistrer ou non les données.
   * @returns {Promise<void>}
   */
  updateEnregistrer: async (id, enregistrer) => {
    await promisePool.query(
      `UPDATE guerrier SET enregistrer = ? WHERE id = ?`,
      [enregistrer, id],
    );
  },

  /**
   * Met à jour la durée de rappel pour la mise à jour physique d'un guerrier.
   *
   * @param {string} id - L'ID du membre.
   * @param {number} rappel_update_physique - La nouvelle durée de rappel.
   * @returns {Promise<void>}
   */
  updateRappelUpdatePhysique: async (id, rappel_update_physique) => {
    await promisePool.query(
      `UPDATE guerrier SET rappel_update_physique = ? WHERE id = ?`,
      [rappel_update_physique, id],
    );
  },

  /**
   * Récupère la durée de rappel pour la mise à jour physique d'un guerrier.
   *
   * @param {string} id - L'ID du membre.
   * @returns {Promise<number>} La durée de rappel en heures.
   */
  getRappelUpdatePhysique: async (id) => {
    const [rows] = await promisePool.query(
      `SELECT rappel_update_physique FROM guerrier WHERE id = ?`,
      [id],
    );
    return rows[0]?.rappel_update_physique || null;
  },

  /**
   * Met à jour la date de dernière modification des données physiques d'un guerrier.
   *
   * @param {string} id - L'ID du membre.
   * @returns {Promise<void>}
   */
  updateDerniereModification: async (id) => {
    await promisePool.query(
      `UPDATE guerrier SET derniere_modification = NOW() WHERE id = ?`,
      [id],
    );
  },
};
