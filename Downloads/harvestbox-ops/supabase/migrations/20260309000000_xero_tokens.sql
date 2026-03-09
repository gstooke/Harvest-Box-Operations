CREATE TABLE IF NOT EXISTS xero_tokens (
  id text PRIMARY KEY,
  tenant_id text NOT NULL DEFAULT '',
  tenant_name text NOT NULL DEFAULT '',
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE xero_tokens ENABLE ROW LEVEL SECURITY;
-- Only the service role (used by edge functions) can access this table
CREATE POLICY "service role only" ON xero_tokens USING (false);
