-- ⚠️ ATTENTION ⚠️
-- Ne pas décommenter les lignes DROP TABLE si vous ne savez pas ce que vous faites.

-- DROP TABLE IF EXISTS basicfit_stats;
-- DROP TABLE IF EXISTS guerrier;

-- Création de la table guerrier
CREATE TABLE IF NOT EXISTS guerrier (

  -- info générale
  id VARCHAR(255) PRIMARY KEY, -- Identifiant unique du guerrier
  username VARCHAR(255) NOT NULL, -- Nom d'utilisateur du guerrier
  count INT NOT NULL DEFAULT 1, -- Compteur, valeur par défaut à 1
  display_stats BOOLEAN NULL, -- Autorisation d'afficher les stats, false par défaut
  enregistrer BOOLEAN NULL, -- Champ pour savoir si la personne veut enregistrer ou non, NULL par défaut
  rappel_update_physique INT NOT NULL DEFAULT 4 CHECK (rappel_update_physique BETWEEN 1 AND 52), -- Durée de rappel en semaines (entre 1 et 52)

  -- info physique
  poids DECIMAL(5,2) NULL, -- Poids en kg, NULL par défaut
  taille DECIMAL(5,2) NULL, -- Taille en cm, NULL par défaut
  age INT NULL, -- Âge, NULL par défaut
  sexe CHAR(1) NULL, -- Sexe ('H' ou 'F'), NULL par défaut
  activite VARCHAR(50) NULL, -- Niveau d'activité, NULL par défaut
  jours INT NULL, -- Jours d'entraînement par semaine, NULL par défaut
  temps INT NULL, -- Temps d'entraînement quotidien (minutes), NULL par défaut
  intensite VARCHAR(20) NULL, -- Intensité de l'entraînement, NULL par défaut
  tef INT NULL, -- TEF (aliments transformés ou non), NULL par défaut

  -- info dans le temps
  derniere_activite DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Dernière activité, NULL par défaut
  derniere_modification DATETIME, -- Dernière modification sur les champs d'autocompletion
  date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP -- Date de création
);

-- Création de la table pour les statistiques Basic Fit (format JSON)
CREATE TABLE IF NOT EXISTS basicfit_stats (
  guerrier_id VARCHAR(255) PRIMARY KEY, -- Identifiant du guerrier, clé primaire
  stats JSON NOT NULL, -- Stockage des statisques sous forme de JSON
  derniere_modification DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Dernière modification
  CONSTRAINT fk_guerrier_id FOREIGN KEY (guerrier_id) REFERENCES guerrier(id) ON DELETE CASCADE
);
