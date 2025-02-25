// utils/dbInit.js
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.db');

// Vérifier si le fichier de base de données existe déjà
const dbExists = fs.existsSync(dbPath);

// Ouvre (ou crée) la base de données
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erreur lors de la connexion à la base de données :', err.message);
    return;
  }
  console.log('Connexion à la base de données réussie.');
});

// Si la base de données n'existe pas, lire et exécuter le fichier SQL d'initialisation
if (!dbExists) {
  const initSqlPath = path.join(__dirname, '..', 'sql', 'init_tables.sql');
  fs.readFile(initSqlPath, 'utf8', (err, sql) => {
    if (err) {
      console.error('Erreur lors de la lecture du fichier SQL :', err.message);
      return;
    }
    db.exec(sql, (err) => {
      if (err) {
        console.error('Erreur lors de l\'exécution du script SQL :', err.message);
      } else {
        console.log('Base de données initialisée avec succès.');
      }
      // Optionnel : fermer la DB ici si vous n’utilisez pas le même objet db dans la suite de votre app
      // db.close();
    });
  });
}
