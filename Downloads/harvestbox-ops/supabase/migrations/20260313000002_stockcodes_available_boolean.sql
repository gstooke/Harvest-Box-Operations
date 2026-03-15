ALTER TABLE stockcodes ALTER COLUMN available TYPE boolean USING (available > 0);
ALTER TABLE stockcodes ALTER COLUMN available SET DEFAULT false;

NOTIFY pgrst, 'reload schema';
