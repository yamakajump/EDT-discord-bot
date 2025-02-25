-- sql/init_tables.sql
CREATE TABLE IF NOT EXISTS nouveau_guerrier (
  id TEXT PRIMARY KEY,
  username TEXT,
  count INTEGER DEFAULT 0,
  date TEXT
);
