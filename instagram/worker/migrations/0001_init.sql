-- Studio Instagram : espace d'équipe partagé (Cloudflare D1)

-- Créations (le projet complet est stocké en JSON ; version = compteur pour détecter les modifications simultanées)
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  format TEXT NOT NULL,
  pages INTEGER NOT NULL,
  data TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  created_by TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  updated_by TEXT NOT NULL,
  deleted_at INTEGER,
  deleted_by TEXT,
  thumb BLOB
);
CREATE INDEX projects_list ON projects (deleted_at, updated_at DESC);

-- Photos importées (réduites à 1600 px côté navigateur, quelques centaines de Ko)
CREATE TABLE assets (
  id TEXT PRIMARY KEY,
  mime TEXT NOT NULL,
  size INTEGER NOT NULL,
  data BLOB NOT NULL,
  created_at INTEGER NOT NULL,
  created_by TEXT NOT NULL
);
CREATE INDEX assets_recent ON assets (created_at DESC);

-- « Mes modèles » de l'équipe
CREATE TABLE templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  format TEXT NOT NULL,
  data TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  created_by TEXT NOT NULL
);
