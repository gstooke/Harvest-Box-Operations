CREATE TABLE IF NOT EXISTS raw_goods (
  id bigint PRIMARY KEY,
  code text NOT NULL,
  description text NOT NULL DEFAULT ''
);
