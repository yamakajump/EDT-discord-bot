/**
 * Module d'initialisation de la base de données
 *
 * Ce module configure un pool de connexions MySQL en utilisant mysql2,
 * lit un script SQL d'initialisation et l'exécute pour créer les tables nécessaires.
 */

const mysql = require("mysql2");
const fs = require("fs").promises;
const path = require("path");

// Affichage des variables d'environnement utilisées pour la connexion
console.log("🔍 Tentative de connexion MySQL avec les paramètres suivants :");
console.log("MYSQL_HOST:", process.env.MYSQL_HOST || "localhost");
console.log("MYSQL_PORT:", process.env.MYSQL_PORT || 3306);
console.log("MYSQL_USER:", process.env.MYSQL_USER || "root");
console.log("MYSQL_PASSWORD:", process.env.MYSQL_PASSWORD ? "******" : "password");
console.log("MYSQL_DATABASE:", process.env.MYSQL_DATABASE || "edt_db");

// Création du pool de connexions MySQL
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || "localhost", // Hôte de la base de données
  port: process.env.MYSQL_PORT || 3306,          // Port MySQL
  user: process.env.MYSQL_USER || "root",          // Nom d'utilisateur
  password: process.env.MYSQL_PASSWORD || "password", // Mot de passe
  database: process.env.MYSQL_DATABASE || "edt_db",   // Base de données cible
  waitForConnections: true, // Active l'attente des connexions disponibles
  connectionLimit: 10,      // Nombre maximum de connexions simultanées
  queueLimit: 0,            // Pas de limite sur la file d'attente
  multipleStatements: true, // Permet l'exécution de plusieurs instructions SQL
});

// Utilisation de la version "promise" du pool pour pouvoir utiliser async/await.
const promisePool = pool.promise();

/**
 * Vérifie la connexion à MySQL en obtenant une connexion depuis le pool.
 */
async function testConnection() {
  try {
    console.log("🔄 Test de connexion à MySQL...");
    const connection = await promisePool.getConnection();
    console.log("✅ Connexion à MySQL réussie !");
    connection.release();
  } catch (err) {
    console.error("❌ Échec de la connexion à MySQL :", err.message);
    throw err;
  }
}

/**
 * Fonction d'initialisation de la base de données.
 *
 * Elle lit le fichier SQL d'initialisation (par exemple, pour créer des tables)
 * puis exécute son contenu sur la base de données.
 *
 * @returns {Promise<void>} Une promesse qui se résout une fois le script exécuté.
 */
async function initializeDatabase() {
  // Test de la connexion avant de lancer le script SQL
  await testConnection();

  // Construction du chemin absolu vers le fichier SQL d'initialisation.
  const initSqlPath = path.join(__dirname, "..", "sql", "init_tables.sql");
  console.log("📂 Lecture du fichier SQL d'initialisation :", initSqlPath);

  try {
    // Lecture du fichier SQL en tant que chaîne de caractères.
    const sql = await fs.readFile(initSqlPath, "utf8");
    console.log("📜 Contenu du script SQL obtenu, exécution en cours...");
    // Exécution du script SQL sur la base de données.
    const [results, fields] = await promisePool.query(sql);
    console.log("🗂️ \x1b[32mBase de données initialisée avec succès.\x1b[0m");
    console.log("Résultats de l'exécution :", results);
  } catch (err) {
    // En cas d'erreur, affichage du message d'erreur complet dans la console.
    console.error("🗂️ \x1b[31mErreur lors de l'exécution du script SQL :\x1b[0m", err);
    throw err;
  }
}

// Exportation du pool en version "promise" et de la fonction d'initialisation.
module.exports = { promisePool, initializeDatabase };
