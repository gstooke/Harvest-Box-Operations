ALTER TABLE stock ADD COLUMN IF NOT EXISTS batch text NOT NULL DEFAULT '';
ALTER TABLE stock ADD COLUMN IF NOT EXISTS best_before date;

NOTIFY pgrst, 'reload schema';
