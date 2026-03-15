-- Add xero_id column so Zapier/xero-sync can upsert by Xero PurchaseOrderID
-- without conflicting with the existing bigint id column.
ALTER TABLE incoming_stock ADD COLUMN IF NOT EXISTS xero_id text;
CREATE UNIQUE INDEX IF NOT EXISTS incoming_stock_xero_id_idx ON incoming_stock (xero_id) WHERE xero_id IS NOT NULL;
