ALTER TABLE stockcodes ADD COLUMN IF NOT EXISTS available numeric NOT NULL DEFAULT 0;

NOTIFY pgrst, 'reload schema';
