-- Create api_tokens table for extension authentication
CREATE TABLE IF NOT EXISTS api_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster lookups
CREATE INDEX idx_api_tokens_user_id ON api_tokens(user_id);

-- Create index on token_hash for authentication lookups
CREATE INDEX idx_api_tokens_token_hash ON api_tokens(token_hash);

-- Enable Row Level Security
ALTER TABLE api_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own tokens
CREATE POLICY "Users can view their own tokens"
  ON api_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can create their own tokens
CREATE POLICY "Users can create their own tokens"
  ON api_tokens
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own tokens
CREATE POLICY "Users can delete their own tokens"
  ON api_tokens
  FOR DELETE
  USING (auth.uid() = user_id);

-- Policy: Users can update their own tokens (for last_used_at)
CREATE POLICY "Users can update their own tokens"
  ON api_tokens
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_api_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_api_tokens_updated_at
  BEFORE UPDATE ON api_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_api_tokens_updated_at();

-- Add comment to table
COMMENT ON TABLE api_tokens IS 'API tokens for browser extension and third-party integrations';

