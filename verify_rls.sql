/**
 * RLS Policy Verification Script
 * 
 * Run this in Supabase SQL Editor to check if UPDATE/DELETE policies exist
 */

-- Check all RLS policies on the links table
SELECT 
  policyname as "Policy Name",
  cmd as "Command Type",
  roles as "Roles",
  qual as "USING Expression",
  with_check as "WITH CHECK Expression"
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'links'
ORDER BY cmd;

-- Expected output should include:
-- 1. Policy for SELECT
-- 2. Policy for INSERT  
-- 3. Policy for UPDATE (if missing, that's the problem!)
-- 4. Policy for DELETE (if missing, that's the problem!)
