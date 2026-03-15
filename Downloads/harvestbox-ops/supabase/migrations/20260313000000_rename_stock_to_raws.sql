ALTER TABLE stock RENAME TO raws;

NOTIFY pgrst, 'reload schema';
