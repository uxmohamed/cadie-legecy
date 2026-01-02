-- DIAGNOSTIC: Check current RLS policies on links table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'links';

-- If empty or missing UPDATE/DELETE policies, run this:
-- CREATE POLICY "Users can update their own links"
-- ON public.links
-- FOR UPDATE
-- TO authenticated
-- USING (auth.uid() = user_id)
-- WITH CHECK (auth.uid() = user_id);

-- CREATE POLICY "Users can delete their own links"
-- ON public.links
-- FOR DELETE  
-- TO authenticated
-- USING (auth.uid() = user_id);
