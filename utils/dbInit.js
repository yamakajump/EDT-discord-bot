// utils/dbInit.js
const mysql = require('mysql2');
const fs = require('fs').promises;
const path = require('path');

// Configuration du pool de connexions
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'password',
  database: process.env.MYSQL_DATABASE || 'edt_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// On utilise la version promise pour bénéficier d'async/await.
const promisePool = pool.promise();

async function initializeDatabase() {
  const initSqlPath = path.join(__dirname, '..', 'sql', 'init_tables.sql');
  try {
    const sql = await fs.readFile(initSqlPath, 'utf8');
    await promisePool.query(sql);
    console.log('Base de données initialisée avec succès.');
  } catch (err) {
    console.error("Erreur lors de l'exécution du script SQL :", err.message);
    throw err;
  }
}

module.exports = { promisePool, initializeDatabase };
