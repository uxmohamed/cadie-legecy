# Vault Setup Guide

This guide will help you set up the Vault read-it-later application with Supabase and Clerk authentication.

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)
- A Clerk account (free tier works)

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Clerk Authentication

1. Go to [https://clerk.com](https://clerk.com) and create an account
2. Create a new application
3. In your Clerk dashboard:
   - Go to **API Keys**
   - Copy your **Publishable Key** and **Secret Key**
4. Create a JWT template for Supabase:
   - Go to **JWT Templates** in the sidebar
   - Click **+ New template**
   - Choose **Supabase** from the templates
   - Name it "supabase" (this exact name is required)
   - Save the template

## Step 3: Set Up Supabase

1. Go to [https://supabase.com](https://supabase.com) and create an account
2. Create a new project
3. Once your project is ready, go to **Project Settings** > **API**:
   - Copy your **Project URL**
   - Copy your **anon/public key**
   - Copy your **service_role key** (keep this secret!)

## Step 4: Configure Supabase Database

1. In your Supabase dashboard, go to **SQL Editor**
2. Open the file `supabase/schema.sql` from this project
3. Copy all the SQL code
4. Paste it into the SQL Editor and click **Run**
5. This creates all tables, indexes, and Row Level Security policies

## Step 5: Configure Clerk-Supabase Integration

1. In Supabase dashboard, go to **Authentication** > **Providers**
2. Scroll down to **Custom Provider** or **JWT**
3. Add your Clerk JWKS URL:
   ```
   https://[your-clerk-domain].clerk.accounts.dev/.well-known/jwks.json
   ```
   Replace `[your-clerk-domain]` with your actual Clerk domain (found in your Clerk dashboard)

## Step 6: Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx
```

Replace the `xxxxx` values with your actual keys from Clerk and Supabase.

## Step 7: Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 8: Test the Application

1. You'll be redirected to sign in
2. Create a new account using Clerk's authentication
3. Once signed in, you can:
   - Add links using the input at the top
   - View your saved links in the list
   - Use keyboard shortcuts (Cmd+F to focus input, Arrow keys to navigate)

## Features

### Implemented

- ✅ User authentication with Clerk
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
1. Make sure your Clerk JWT template is named exactly "supabase"
2. Verify your Clerk JWKS URL is correctly configured in Supabase
3. Check that all environment variables are set correctly

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
- **Authentication**: Clerk
- **Database**: Supabase (PostgreSQL)
- **Metadata Extraction**: Cheerio for HTML parsing
- **Deployment**: Vercel (recommended)

## Security

- All API routes are protected with Clerk authentication
- Row Level Security ensures users can only access their own data
- Service role key is only used server-side
- No sensitive data is exposed to the client

## Support

For issues or questions:
- Check the [Clerk documentation](https://clerk.com/docs)
- Check the [Supabase documentation](https://supabase.com/docs)
- Review the code in `src/lib/supabase/` for database utilities
- Review the code in `src/app/api/` for API routes

