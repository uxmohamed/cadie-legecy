# Vault Setup Guide

This guide will help you set up the Vault read-it-later application with Supabase authentication.

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Supabase

1. Go to [https://supabase.com](https://supabase.com) and create an account
2. Create a new project
3. Once your project is ready, go to **Project Settings** > **API**:
   - Copy your **Project URL**
   - Copy your **anon/public key**
   - Copy your **service_role key** (keep this secret!)

## Step 3: Configure Supabase Database

1. In your Supabase dashboard, go to **SQL Editor**
2. Open the file `supabase/schema.sql` from this project
3. Copy all the SQL code
4. Paste it into the SQL Editor and click **Run**
5. This creates all tables, indexes, and Row Level Security policies

## Step 4: Configure Supabase Authentication

1. In your Supabase dashboard, go to **Authentication** > **Email Templates**
2. Customize the magic link email template if desired
3. Ensure email authentication is enabled in **Authentication** > **Providers**

## Step 5: Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx

# Site URL (IMPORTANT for production deployments)
# For local development, you can omit this or set it to http://localhost:3000
# For production (Vercel), set this to your production domain
NEXT_PUBLIC_SITE_URL=https://vault-theta-lac.vercel.app
```

Replace the `xxxxx` values with your actual keys from Supabase.

**Important**: The `NEXT_PUBLIC_SITE_URL` variable is crucial for authentication to work correctly in production. Without it, the authentication redirect may point to localhost instead of your live domain.

## Step 6: Configure Vercel Environment Variables (Production Only)

If deploying to Vercel:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** > **Environment Variables**
3. Add the following variables:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
   - `NEXT_PUBLIC_SITE_URL`: Your production domain (e.g., `https://vault-theta-lac.vercel.app`)
4. Redeploy your application

## Step 7: Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 8: Test the Application

1. You'll be redirected to the authentication page
2. Enter your email address to receive a magic link
3. Check your email and click the magic link
4. You'll be redirected back to the app and logged in
5. Once signed in, you can:
   - Add links using the input at the top
   - View your saved links in the list
   - Use keyboard shortcuts (Cmd+F to focus input, Arrow keys to navigate)

## Features

### Implemented

- ✅ User authentication with Supabase OTP (magic links)
- ✅ Link storage in Supabase
- ✅ Automatic metadata extraction (title, favicon, description)
- ✅ URL cleaning (removes tracking parameters)
- ✅ Keyboard-first navigation
- ✅ Loading states and error handling
- ✅ Toast notifications
- ✅ Empty states
- ✅ Row Level Security (users only see their own data)

### Future Enhancements

- AI summaries for saved links
- Auto-tagging with AI
- Category management UI
- Browser extension
- Raycast command
- iOS Shortcut
- YouTube video summarization
- Full-text search
- AI-powered RSS feeds

## Troubleshooting

### Authentication Issues

If you're getting authentication errors:
1. Verify that `NEXT_PUBLIC_SITE_URL` is set correctly in production
2. Check that all environment variables are set correctly in Vercel
3. Ensure email authentication is enabled in Supabase
4. Check your spam folder for the magic link email

If the magic link redirects to localhost in production:
1. Make sure `NEXT_PUBLIC_SITE_URL` is set to your production domain in Vercel
2. Redeploy your application after adding the environment variable

### Database Issues

If you're getting database errors:
1. Make sure you ran the SQL schema in Supabase
2. Verify Row Level Security policies are enabled
3. Check that your Supabase anon key is correct

### Build Issues

If the build fails:
1. Delete `.next` folder: `rm -rf .next`
2. Delete `node_modules`: `rm -rf node_modules`
3. Reinstall dependencies: `npm install`
4. Try building again: `npm run build`

## Architecture

- **Frontend**: Next.js 15 with App Router, React, TypeScript
- **Styling**: Tailwind CSS with neutral color palette
- **Authentication**: Supabase OTP (Magic Links)
- **Database**: Supabase (PostgreSQL)
- **Metadata Extraction**: Cheerio for HTML parsing
- **Deployment**: Vercel (recommended)

## Security

- All API routes are protected with Supabase authentication
- Row Level Security ensures users can only access their own data
- Service role key is only used server-side
- No sensitive data is exposed to the client
- Magic links expire after use for security

## Support

For issues or questions:
- Check the [Supabase documentation](https://supabase.com/docs)
- Review the [Supabase authentication guide](https://supabase.com/docs/guides/auth)
- Review the code in `src/lib/supabase/` for database utilities
- Review the code in `src/app/api/` for API routes

