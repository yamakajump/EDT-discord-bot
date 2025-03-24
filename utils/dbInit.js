/**
 * Module d'initialisation de la base de données
 *
 * Ce module configure un pool de connexions MySQL en utilisant mysql2,
 * lit un script SQL d'initialisation et l'exécute pour créer les tables nécessaires.
 */

const mysql = require("mysql2");
const fs = require("fs").promises;
const path = require("path");

// Configuration du pool de connexions.
// Les paramètres de connexion sont récupérés via les variables d'environnement
// sinon des valeurs par défaut sont utilisées.
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || "localhost", // Hôte de la base de données
  user: process.env.MYSQL_USER || "root", // Nom d'utilisateur
  password: process.env.MYSQL_PASSWORD || "password", // Mot de passe
  database: process.env.MYSQL_DATABASE || "edt_db", // Base de données cible
  waitForConnections: true, // Active l'attente des connexions disponibles
  connectionLimit: 10, // Nombre maximum de connexions simultanées
  queueLimit: 0, // Pas de limite sur la file d'attente
});

// Utilisation de la version "promise" du pool pour pouvoir utiliser async/await.
const promisePool = pool.promise();

/**
 * Fonction d'initialisation de la base de données.
 *
 * Elle lit le fichier SQL d'initialisation (par exemple, pour créer des tables)
 * puis exécute son contenu sur la base de données.
 *
 * @returns {Promise<void>} Une promesse qui se résout une fois le script exécuté.
 */
async function initializeDatabase() {
  // Construction du chemin absolu vers le fichier SQL d'initialisation.
  const initSqlPath = path.join(__dirname, "..", "sql", "init_tables.sql");

  try {
    // Lecture du fichier SQL en tant que chaîne de caractères.
    const sql = await fs.readFile(initSqlPath, "utf8");
    // Exécution du script SQL sur la base de données.
    await promisePool.query(sql);
    console.log("Base de données initialisée avec succès.");
  } catch (err) {
    // En cas d'erreur, affichage du message d'erreur dans la console.
    console.error("Erreur lors de l'exécution du script SQL :", err.message);
    throw err;
  }
}

// Exportation du pool en version "promise" et de la fonction d'initialisation.
module.exports = { promisePool, initializeDatabase };
