CREATE TABLE IF NOT EXISTS raw_defs (
  id bigint PRIMARY KEY,
  raw_id text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  available boolean NOT NULL DEFAULT false,
  raw_type text NOT NULL DEFAULT 'Food'
);

NOTIFY pgrst, 'reload schema';
