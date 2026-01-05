-- ============================================
-- Migration: Spaces Feature
-- Created: 2026-01-05
-- ============================================
-- This migration:
-- 1. Drops the categories table (replaced by spaces)
-- 2. Removes category_id column from links table
-- 3. Creates spaces table
-- 4. Creates link_spaces junction table
-- 5. Sets up RLS policies for both new tables
-- ============================================

-- Step 1: Drop foreign key constraint on links.category_id if it exists
ALTER TABLE IF EXISTS public.links 
  DROP CONSTRAINT IF EXISTS links_category_id_fkey;

-- Step 2: Remove category_id column from links table
ALTER TABLE IF EXISTS public.links 
  DROP COLUMN IF EXISTS category_id;

-- Step 3: Drop categories table (CASCADE to remove any remaining dependencies)
DROP TABLE IF EXISTS public.categories CASCADE;

-- Step 4: Create spaces table
CREATE TABLE IF NOT EXISTS public.spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT spaces_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Step 5: Create link_spaces junction table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS public.link_spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL,
  space_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT link_spaces_link_id_fkey FOREIGN KEY (link_id) REFERENCES public.links(id) ON DELETE CASCADE,
  CONSTRAINT link_spaces_space_id_fkey FOREIGN KEY (space_id) REFERENCES public.spaces(id) ON DELETE CASCADE,
  CONSTRAINT link_spaces_unique UNIQUE (link_id, space_id)
);

-- Step 6: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_spaces_user_id ON public.spaces(user_id);
CREATE INDEX IF NOT EXISTS idx_spaces_sort_order ON public.spaces(user_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_link_spaces_link_id ON public.link_spaces(link_id);
CREATE INDEX IF NOT EXISTS idx_link_spaces_space_id ON public.link_spaces(space_id);

-- Step 7: Enable RLS on spaces table
ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;

-- Step 8: Create RLS policies for spaces table
-- Users can only see their own spaces
CREATE POLICY "Users can view their own spaces"
ON public.spaces
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own spaces
CREATE POLICY "Users can create their own spaces"
ON public.spaces
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own spaces
CREATE POLICY "Users can update their own spaces"
ON public.spaces
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own spaces
CREATE POLICY "Users can delete their own spaces"
ON public.spaces
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Step 9: Enable RLS on link_spaces table
ALTER TABLE public.link_spaces ENABLE ROW LEVEL SECURITY;

-- Step 10: Create RLS policies for link_spaces table
-- Users can only see link_spaces for their own links and spaces
CREATE POLICY "Users can view their own link_spaces"
ON public.link_spaces
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.links
    WHERE links.id = link_spaces.link_id
    AND links.user_id = auth.uid()::text
  )
  AND EXISTS (
    SELECT 1 FROM public.spaces
    WHERE spaces.id = link_spaces.space_id
    AND spaces.user_id = auth.uid()
  )
);

-- Users can insert link_spaces for their own links and spaces
CREATE POLICY "Users can create their own link_spaces"
ON public.link_spaces
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.links
    WHERE links.id = link_spaces.link_id
    AND links.user_id = auth.uid()::text
  )
  AND EXISTS (
    SELECT 1 FROM public.spaces
    WHERE spaces.id = link_spaces.space_id
    AND spaces.user_id = auth.uid()
  )
);

-- Users can delete link_spaces for their own links and spaces
CREATE POLICY "Users can delete their own link_spaces"
ON public.link_spaces
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.links
    WHERE links.id = link_spaces.link_id
    AND links.user_id = auth.uid()::text
  )
  AND EXISTS (
    SELECT 1 FROM public.spaces
    WHERE spaces.id = link_spaces.space_id
    AND spaces.user_id = auth.uid()
  )
);

-- Step 11: Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 12: Create trigger to auto-update updated_at on spaces
CREATE TRIGGER update_spaces_updated_at
  BEFORE UPDATE ON public.spaces
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
