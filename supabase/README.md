# Supabase Setup

## Database Migrations

This project uses SQL migrations for database schema management. All migrations are located in the `migrations/` directory.

### Running Migrations

To set up or update the database schema:

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run each migration file in order (001, 002, etc.)
4. Copy and paste the contents of each migration file
5. Click **Run**

### Current Migrations

- `001_create_api_tokens_table.sql` - API tokens for browser extension authentication

This will create:
- Tables: `categories`, `links`, `api_tokens`
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

