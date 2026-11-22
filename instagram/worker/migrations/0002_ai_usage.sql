-- Assistant IA du Studio : nombre de demandes et jetons consommés, par personne et par jour (UTC).
-- Sert au quota quotidien et à suivre la dépense.
CREATE TABLE ai_usage (
  email TEXT NOT NULL,
  day TEXT NOT NULL,
  requests INTEGER NOT NULL DEFAULT 0,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  cache_read_tokens INTEGER NOT NULL DEFAULT 0,
  cache_write_tokens INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (email, day)
);
