-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (optional, for user preferences)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, -- Clerk user ID
  email TEXT NOT NULL,
  display_name TEXT,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL, -- hex color code
  icon TEXT, -- emoji or icon name
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Links table
CREATE TABLE IF NOT EXISTS links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL, -- original URL
  clean_url TEXT NOT NULL, -- cleaned URL without tracking
  domain TEXT NOT NULL, -- extracted domain
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  favicon_url TEXT,
  og_image_url TEXT,
  description TEXT,
  content_type TEXT NOT NULL DEFAULT 'url', -- 'url', 'color', 'text'
  color_value TEXT, -- for color entries
  notes TEXT, -- user's personal notes
  ai_summary TEXT, -- AI-generated summary
  ai_tags TEXT[], -- AI-generated tags
  ai_key_themes JSONB, -- AI extracted themes
  ai_quotes JSONB, -- AI extracted quotes [{text, author}]
  ai_facts JSONB, -- AI extracted facts and stats
  ai_people TEXT[], -- Important people/ideas mentioned
  is_archived BOOLEAN DEFAULT FALSE,
  is_favorite BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Link tags table (for custom user tags)
CREATE TABLE IF NOT EXISTS link_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  link_id UUID NOT NULL REFERENCES links(id) ON DELETE CASCADE,
  tag_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(link_id, tag_name)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_id ON users(id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(user_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_links_user_id ON links(user_id);
CREATE INDEX IF NOT EXISTS idx_links_created_at ON links(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_links_category_id ON links(category_id);
CREATE INDEX IF NOT EXISTS idx_links_domain ON links(domain);
CREATE INDEX IF NOT EXISTS idx_links_is_archived ON links(user_id, is_archived);
CREATE INDEX IF NOT EXISTS idx_link_tags_link_id ON link_tags(link_id);
CREATE INDEX IF NOT EXISTS idx_link_tags_tag_name ON link_tags(tag_name);

-- Create full-text search index
CREATE INDEX IF NOT EXISTS idx_links_search ON links USING gin(
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(notes, '') || ' ' || coalesce(ai_summary, ''))
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE links ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  USING (auth.jwt() ->> 'sub' = id);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  USING (auth.jwt() ->> 'sub' = id);

CREATE POLICY "Users can insert own data"
  ON users FOR INSERT
  WITH CHECK (auth.jwt() ->> 'sub' = id);

-- RLS Policies for categories table
CREATE POLICY "Users can view own categories"
  ON categories FOR SELECT
  USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert own categories"
  ON categories FOR INSERT
  WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update own categories"
  ON categories FOR UPDATE
  USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete own categories"
  ON categories FOR DELETE
  USING (auth.jwt() ->> 'sub' = user_id);

-- RLS Policies for links table
CREATE POLICY "Users can view own links"
  ON links FOR SELECT
  USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert own links"
  ON links FOR INSERT
  WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update own links"
  ON links FOR UPDATE
  USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete own links"
  ON links FOR DELETE
  USING (auth.jwt() ->> 'sub' = user_id);

-- RLS Policies for link_tags table
CREATE POLICY "Users can view own link tags"
  ON link_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM links
      WHERE links.id = link_tags.link_id
      AND links.user_id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "Users can insert own link tags"
  ON link_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM links
      WHERE links.id = link_tags.link_id
      AND links.user_id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "Users can delete own link tags"
  ON link_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM links
      WHERE links.id = link_tags.link_id
      AND links.user_id = auth.jwt() ->> 'sub'
    )
  );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_links_updated_at BEFORE UPDATE ON links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

