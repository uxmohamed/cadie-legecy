-- Drop all existing RLS policies
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;

DROP POLICY IF EXISTS "Users can view own categories" ON categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON categories;
DROP POLICY IF EXISTS "Users can update own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON categories;

DROP POLICY IF EXISTS "Users can view own links" ON links;
DROP POLICY IF EXISTS "Users can insert own links" ON links;
DROP POLICY IF EXISTS "Users can update own links" ON links;
DROP POLICY IF EXISTS "Users can delete own links" ON links;

DROP POLICY IF EXISTS "Users can view own link tags" ON link_tags;
DROP POLICY IF EXISTS "Users can insert own link tags" ON link_tags;
DROP POLICY IF EXISTS "Users can delete own link tags" ON link_tags;

-- Create new RLS policies using auth.uid()
-- RLS Policies for users table
CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  USING (auth.uid()::text = id);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  USING (auth.uid()::text = id);

CREATE POLICY "Users can insert own data"
  ON users FOR INSERT
  WITH CHECK (auth.uid()::text = id);

-- RLS Policies for categories table
CREATE POLICY "Users can view own categories"
  ON categories FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own categories"
  ON categories FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own categories"
  ON categories FOR UPDATE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own categories"
  ON categories FOR DELETE
  USING (auth.uid()::text = user_id);

-- RLS Policies for links table
CREATE POLICY "Users can view own links"
  ON links FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own links"
  ON links FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own links"
  ON links FOR UPDATE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own links"
  ON links FOR DELETE
  USING (auth.uid()::text = user_id);

-- RLS Policies for link_tags table
CREATE POLICY "Users can view own link tags"
  ON link_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM links
      WHERE links.id = link_tags.link_id
      AND links.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert own link tags"
  ON link_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM links
      WHERE links.id = link_tags.link_id
      AND links.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete own link tags"
  ON link_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM links
      WHERE links.id = link_tags.link_id
      AND links.user_id = auth.uid()::text
    )
  );

