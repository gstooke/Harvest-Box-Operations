ALTER TABLE orders ADD COLUMN IF NOT EXISTS xero_id text;
CREATE UNIQUE INDEX IF NOT EXISTS orders_xero_id_idx ON orders (xero_id) WHERE xero_id IS NOT NULL;
