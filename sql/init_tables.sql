-- sql/init_tables.sql
CREATE TABLE IF NOT EXISTS nouveau_guerrier (
  id VARCHAR(255) PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  count INT NOT NULL DEFAULT 1,
  date DATETIME NOT NULL
);
