-- ============================================
-- FIX: Add Missing RLS Policies for links table
-- ============================================
--
-- PROBLEM: UPDATE and DELETE operations return 200 OK but don't persist
-- CAUSE: RLS policies are blocking UPDATE/DELETE while allowing INSERT/SELECT
--
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/bvgxievzgugjtnlokkgt/sql/new
--
-- ============================================

-- Step 1: Check if policies already exist (optional diagnostic)
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'links';

-- Step 2: Drop existing UPDATE/DELETE policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can update their own links" ON public.links;
DROP POLICY IF EXISTS "Users can delete their own links" ON public.links;

-- Step 3: Create UPDATE policy
CREATE POLICY "Users can update their own links"
ON public.links
FOR UPDATE
TO authenticated
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

-- Step 4: Create DELETE policy  
CREATE POLICY "Users can delete their own links"
ON public.links
FOR DELETE
TO authenticated
USING (auth.uid()::text = user_id);

-- Step 5: Verify policies were created
SELECT policyname, cmd, roles
FROM pg_policies  
WHERE tablename = 'links'
ORDER BY cmd;

-- Expected output:
-- You should see 4 policies total:
-- - SELECT (authenticated)
-- - INSERT (authenticated)
-- - UPDATE (authenticated) <- NEW
-- - DELETE (authenticated) <- NEW
