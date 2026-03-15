CREATE TABLE IF NOT EXISTS stockcodes (
  id bigint PRIMARY KEY,
  code text NOT NULL,
  description text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'Food',
  CONSTRAINT stockcodes_code_unique UNIQUE (code)
);

NOTIFY pgrst, 'reload schema';
