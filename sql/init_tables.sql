-- ⚠️ ATTENTION ⚠️
-- Ne pas décommenter les lignes DROP TABLE si vous ne savez pas ce que vous faites.

-- DROP TABLE IF EXISTS basicfit_stats;
-- DROP TABLE IF EXISTS guerrier;

-- Création de la table guerrier
CREATE TABLE IF NOT EXISTS guerrier (
  id VARCHAR(255) PRIMARY KEY,            -- Identifiant unique du guerrier
  username VARCHAR(255) NOT NULL,           -- Nom d'utilisateur du guerrier
  count INT NOT NULL DEFAULT 1,             -- Compteur, valeur par défaut à 1
  display_stats TINYINT(1) NOT NULL DEFAULT 0, -- Booléen pour autoriser ou non l'affichage des stats, par défaut false (0)
  date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP  -- Dernière activité
);

-- Création de la table pour les statistiques Basic Fit au format JSON
CREATE TABLE IF NOT EXISTS basicfit_stats (
  guerrier_id VARCHAR(255) PRIMARY KEY,   -- Identifiant du guerrier servant de clé primaire
  stats JSON NOT NULL,                      -- Stockage des statistiques sous forme de JSON
  derniere_modification DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,  -- Dernière modification
  CONSTRAINT fk_guerrier_id FOREIGN KEY (guerrier_id) REFERENCES guerrier(id) ON DELETE CASCADE 
);
