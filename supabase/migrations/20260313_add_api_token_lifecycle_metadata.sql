ALTER TABLE api_tokens
  ADD COLUMN IF NOT EXISTS scope text[] NOT NULL DEFAULT ARRAY['legacy_full_access']::text[],
  ADD COLUMN IF NOT EXISTS revoked_at timestamptz,
  ADD COLUMN IF NOT EXISTS revoked_reason text,
  ADD COLUMN IF NOT EXISTS client_id text,
  ADD COLUMN IF NOT EXISTS install_id text,
  ADD COLUMN IF NOT EXISTS install_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS rotated_from_token_id uuid REFERENCES api_tokens(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rotated_at timestamptz;

UPDATE api_tokens
SET
  scope = COALESCE(scope, ARRAY['legacy_full_access']::text[]),
  install_metadata = COALESCE(install_metadata, '{}'::jsonb)
WHERE scope IS NULL OR install_metadata IS NULL;

CREATE INDEX IF NOT EXISTS idx_api_tokens_active_hash
  ON api_tokens(token_hash)
  WHERE revoked_at IS NULL AND expires_at > now();

CREATE INDEX IF NOT EXISTS idx_api_tokens_active_install
  ON api_tokens(user_id, install_id, client_id)
  WHERE revoked_at IS NULL AND install_id IS NOT NULL;
