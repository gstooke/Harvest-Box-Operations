CREATE TABLE IF NOT EXISTS stock (
  id bigint PRIMARY KEY,
  code text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  qty_received numeric NOT NULL DEFAULT 0,
  qty_available numeric NOT NULL DEFAULT 0,
  po_id bigint,
  po_number text NOT NULL DEFAULT '',
  supplier text NOT NULL DEFAULT '',
  received_at timestamptz
);

NOTIFY pgrst, 'reload schema';
