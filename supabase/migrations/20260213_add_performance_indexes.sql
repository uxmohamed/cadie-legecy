-- Performance indexes for common query patterns
-- Created: 2026-02-13

-- Most common query: user's active links sorted by date
CREATE INDEX IF NOT EXISTS idx_links_user_active
  ON links(user_id, is_deleted, is_archived, created_at DESC);

-- Duplicate detection by clean_url (partial index for non-deleted only)
CREATE INDEX IF NOT EXISTS idx_links_user_clean_url
  ON links(user_id, clean_url) WHERE is_deleted = false;

-- Pinned links sorting (partial index for non-deleted only)
CREATE INDEX IF NOT EXISTS idx_links_user_pinned
  ON links(user_id, is_pinned DESC, created_at DESC) WHERE is_deleted = false;

-- Space link lookup (junction table)
CREATE INDEX IF NOT EXISTS idx_link_spaces_space
  ON link_spaces(space_id, link_id);

-- Token lookup by hash (partial index for non-expired)
CREATE INDEX IF NOT EXISTS idx_api_tokens_hash
  ON api_tokens(token_hash) WHERE expires_at > now();
