-- User profiles table for onboarding + personalization
-- Run this migration in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT, -- Custom avatar URL (preset path or uploaded URL)
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- ============================================
-- STORAGE BUCKET FOR AVATARS
-- Run this SEPARATELY in Supabase Dashboard > Storage
-- ============================================

-- Create the avatars bucket (do this in Dashboard UI first, or use:)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Storage RLS Policies (run after creating bucket)
-- These allow users to upload avatars to their own folder

-- DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
-- CREATE POLICY "Users can upload own avatar" ON storage.objects
--   FOR INSERT WITH CHECK (
--     bucket_id = 'avatars' AND 
--     auth.uid()::text = (storage.foldername(name))[1]
--   );

-- DROP POLICY IF EXISTS "Public avatar access" ON storage.objects;
-- CREATE POLICY "Public avatar access" ON storage.objects
--   FOR SELECT USING (bucket_id = 'avatars');

-- DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
-- CREATE POLICY "Users can update own avatar" ON storage.objects
--   FOR UPDATE USING (
--     bucket_id = 'avatars' AND 
--     auth.uid()::text = (storage.foldername(name))[1]
--   );
