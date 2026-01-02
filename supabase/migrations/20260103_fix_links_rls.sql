-- ============================================
-- Migration: Fix RLS Policies for links table
-- Created: 2026-01-03
-- ============================================
--
-- PROBLEM: UPDATE and DELETE operations silently fail
-- CAUSE: RLS is enabled but missing UPDATE/DELETE policies
--
-- ============================================

-- Step 1: Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Users can update their own links" ON public.links;
DROP POLICY IF EXISTS "Users can delete their own links" ON public.links;

-- Step 2: Create UPDATE policy
-- Allows authenticated users to update only their own links
CREATE POLICY "Users can update their own links"
ON public.links
FOR UPDATE
TO authenticated
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

-- Step 3: Create DELETE policy
-- Allows authenticated users to delete only their own links
CREATE POLICY "Users can delete their own links"
ON public.links
FOR DELETE
TO authenticated
USING (auth.uid()::text = user_id);

-- Verification query (run manually to confirm):
-- SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'links' ORDER BY cmd;
