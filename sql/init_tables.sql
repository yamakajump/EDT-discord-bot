-- Ce script crée la table "nouveau_guerrier" si elle n'existe pas déjà.
-- La table est utilisée pour stocker des informations sur les "nouveaux guerriers" :
-- - "id" est l'identifiant unique (clé primaire) de chaque enregistrement.
-- - "username" est le nom d'utilisateur associé.
-- - "count" représente un compteur, initialisé à 1 par défaut.
-- - "date" enregistre la date et l'heure de création de l'enregistrement.

CREATE TABLE IF NOT EXISTS nouveau_guerrier (
  id VARCHAR(255) PRIMARY KEY,          -- Identifiant unique du guerrier
  username VARCHAR(255) NOT NULL,       -- Nom d'utilisateur du guerrier
  count INT NOT NULL DEFAULT 1,         -- Compteur, valeur par défaut à 1
  date DATETIME NOT NULL                -- Date et heure de création de l'enregistrement
);
