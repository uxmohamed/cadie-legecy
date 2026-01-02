-- Migration: Enforce API Token Expiration
-- Created: 2026-01-02
-- Description: Add expires_at column, backfill existing tokens with expiration, and enforce NOT NULL constraint

-- Step 1: Add expires_at column (nullable initially to allow backfill)
ALTER TABLE api_tokens
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Step 2: Set default expiration for existing tokens (90 days from creation)
UPDATE api_tokens
SET expires_at = created_at + INTERVAL '90 days'
WHERE expires_at IS NULL;

-- Step 3: Make expires_at NOT NULL and set default value (90 days from now)
ALTER TABLE api_tokens
ALTER COLUMN expires_at SET NOT NULL,
ALTER COLUMN expires_at SET DEFAULT (NOW() + INTERVAL '90 days');

-- Step 4: Add indexes for efficient expiration checks
CREATE INDEX IF NOT EXISTS idx_api_tokens_expires_at ON api_tokens(expires_at);

-- Step 5: Add composite index for token lookup with expiration check
CREATE INDEX IF NOT EXISTS idx_api_tokens_hash_expires ON api_tokens(token_hash, expires_at);

-- Step 6: Add comment to document the expiration policy
COMMENT ON COLUMN api_tokens.expires_at IS 'Token expiration timestamp. Tokens expire 90 days after creation by default. Expired tokens are rejected during authentication.';
