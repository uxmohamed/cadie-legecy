# Supabase Setup

## Database Schema

To set up the database schema, run the SQL commands in `schema.sql` in your Supabase SQL editor:

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `schema.sql`
4. Click **Run**

This will create:
- Tables: `users`, `categories`, `links`, `link_tags`
- Indexes for performance optimization
- Row Level Security (RLS) policies
- Triggers for `updated_at` timestamps

## Row Level Security

All tables have RLS enabled. Users can only access/modify their own data based on their Clerk user ID stored in the JWT token.

## Environment Variables

Make sure to add your Supabase credentials to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## JWT Integration with Clerk

The RLS policies use `auth.jwt() ->> 'sub'` to extract the Clerk user ID from the JWT token. Make sure your Supabase project is configured to accept JWTs from Clerk:

1. In Supabase Dashboard, go to **Authentication** > **Providers**
2. Find "Custom" or configure JWT settings
3. Add Clerk's JWKS URL: `https://your-clerk-domain/.well-known/jwks.json`

