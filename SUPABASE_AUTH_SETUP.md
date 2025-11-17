# Supabase Authentication Setup Guide

The app now uses Supabase Authentication instead of Clerk. Follow these steps to complete the setup.

## 1. Run the RLS Policy Migration

In your Supabase dashboard:

1. Go to **SQL Editor**
2. Open the file `supabase/migration_update_rls.sql` from this project
3. Copy all the SQL code
4. Paste it into the SQL Editor
5. Click **Run**

This will update all Row Level Security policies to use Supabase's `auth.uid()` function.

## 2. Configure Supabase Authentication

In your Supabase dashboard:

1. Go to **Authentication** > **Providers**
2. Make sure **Email** provider is enabled
3. Configure email settings:
   - **Enable email confirmations** (recommended for production)
   - For development, you can disable email confirmations in **Settings** > **Auth** > **Email Auth**

## 3. Environment Variables

Your `.env.local` should only have Supabase variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://bvgxievzgugjtnlokkgt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (optional)
```

**Note:** Clerk variables have been removed.

## 4. Test the Application

```bash
npm run dev
```

### Testing Flow:

1. **Open** http://localhost:3000
2. You'll be redirected to **/auth**
3. **Sign up** with an email and password
4. Check your email for confirmation (if enabled)
5. **Sign in** with your credentials
6. You should be redirected to the main app
7. **Add a link** to test the full flow
8. Check your Supabase dashboard → **Table Editor** → **links** table to see the saved link

## 5. Verify Database Access

After signing in and adding a link:

1. Go to Supabase Dashboard → **Table Editor**
2. Select the **links** table
3. You should see your link with your `user_id` from Supabase Auth

## Key Features

✅ **Email/Password Authentication** - Sign up and sign in with email
✅ **Session Management** - Automatic session refresh
✅ **Protected Routes** - Middleware protects all routes except /auth
✅ **Row Level Security** - Users can only access their own data
✅ **Automatic Redirects** - Redirect to /auth if not logged in, redirect to / if already logged in

## Troubleshooting

### "Unauthorized" errors when fetching links
- Make sure you've run the RLS migration SQL
- Check that you're signed in (user avatar should appear in top-right)
- Verify your Supabase URL and Anon Key in `.env.local`

### Email confirmation issues
- For development, disable email confirmations in Supabase dashboard
- Go to **Authentication** > **Settings** > Disable "Enable email confirmations"

### Links not saving
- Check browser console for errors
- Verify RLS policies are updated (run migration SQL)
- Check that `user_id` column in links table is type TEXT

## Next Steps

- Enable additional auth providers (Google, GitHub, etc.) in Supabase
- Customize email templates in Supabase dashboard
- Set up password reset flow
- Add profile management

## Differences from Clerk

| Feature | Clerk | Supabase |
|---------|-------|----------|
| Auth Provider | Third-party | Built-in |
| JWT Template | Required | Not needed |
| User Management | Clerk Dashboard | Supabase Dashboard |
| Cost | Free tier limited | More generous free tier |
| Integration | More complex | Simpler, native |

Supabase authentication is now fully integrated and ready to use! 🎉

