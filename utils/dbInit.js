/**
 * Module d'initialisation de la base de données
 *
 * Ce module configure un pool de connexions MySQL en utilisant mysql2,
 * lit un script SQL d'initialisation et l'exécute pour créer les tables nécessaires.
 */

const mysql = require("mysql2");
const path = require("path");

// Affichage des variables d'environnement utilisées pour la connexion
console.log(
  "\x1b[38;5;4m🔍  Tentative de connexion MySQL avec les paramètres suivants :\x1b[0m",
);
console.log(
  "\x1b[38;5;6mMYSQL_HOST:\x1b[0m",
  process.env.MYSQL_HOST || "localhost",
);
console.log("\x1b[38;5;6mMYSQL_PORT:\x1b[0m", process.env.MYSQL_PORT || 3306);
console.log("\x1b[38;5;6mMYSQL_USER:\x1b[0m", process.env.MYSQL_USER || "root");
console.log(
  "\x1b[38;5;6mMYSQL_PASSWORD:\x1b[0m",
  process.env.MYSQL_PASSWORD ? "******" : "password",
);
console.log(
  "\x1b[38;5;6mMYSQL_DATABASE:\x1b[0m",
  process.env.MYSQL_DATABASE || "edt_db",
);

// Création du pool de connexions MySQL
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || "localhost", // Hôte de la base de données
  port: process.env.MYSQL_PORT || 3306, // Port MySQL
  user: process.env.MYSQL_USER || "root", // Nom d'utilisateur
  password: process.env.MYSQL_PASSWORD || "password", // Mot de passe
  database: process.env.MYSQL_DATABASE || "edt_db", // Base de données cible
  waitForConnections: true, // Active l'attente des connexions disponibles
  connectionLimit: 10, // Nombre maximum de connexions simultanées
  queueLimit: 0, // Pas de limite sur la file d'attente
  multipleStatements: true, // Permet l'exécution de plusieurs instructions SQL
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
    console.log(
      "\x1b[38;5;4m📂  Lecture du fichier SQL d'initialisation :\x1b[0m",
      initSqlPath,
    );
    // Lecture du fichier SQL en tant que chaîne de caractères.
    console.log("\x1b[38;5;4m📝  Contenu du fichier SQL chargé.\x1b[0m");
    // Exécution du script SQL sur la base de données.
    console.log(
      "\x1b[38;5;2m🗂️  Base de données initialisée avec succès.\x1b[0m",
    );
  } catch (err) {
    // En cas d'erreur, affichage du message d'erreur complet dans la console.
    console.error(
      "\x1b[38;5;1m🗂️   Erreur lors de l'exécution du script SQL :\x1b[0m",
      err,
    );
    throw err;
  }
}

// Exportation du pool en version "promise" et de la fonction d'initialisation.
module.exports = { promisePool, initializeDatabase };
