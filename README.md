# Vault - Personal Read-it-Later App

A minimal, keyboard-friendly read-it-later application with automatic metadata extraction and AI-ready architecture.

## Features

- 🔐 **Secure Authentication** - Magic link authentication via Supabase OTP
- 💾 **Personal Data Storage** - Your data stays in your own Supabase database
- 🎯 **Auto Metadata Extraction** - Automatically fetches titles, descriptions, and favicons
- 🧹 **URL Cleaning** - Removes tracking parameters automatically
- ⌨️ **Keyboard-First** - Full keyboard navigation support
- 🎨 **Clean Design** - Minimal, Linear/Craft-inspired interface
- 🔒 **Row Level Security** - Only you can see your data
- 📱 **Responsive** - Works on all devices

## Quick Start

### Prerequisites

- Node.js 18+
- Supabase account (free tier)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd vault
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Create a `.env.local` file
   - Add your Supabase credentials and production URL (see SETUP.md)

4. Set up the database:
   - Follow the instructions in `SETUP.md`

5. Run the development server:
```bash
npm run dev
```

## Documentation

- 📖 [Setup Guide](./SETUP.md) - Detailed setup instructions
- 🗄️ [Database Schema](./supabase/schema.sql) - PostgreSQL schema with RLS

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React, TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Supabase OTP (Magic Links)
- **Database**: Supabase (PostgreSQL)
- **Metadata**: Cheerio for HTML parsing
- **Deployment**: Vercel-ready

## Keyboard Shortcuts

- `Cmd/Ctrl + F` - Focus input
- `↑/↓` - Navigate links
- `Home` - Jump to first link
- `End` - Jump to last link
- `Enter` - Open link in new tab
- `Escape` - Clear input and blur

## Project Structure

```
vault/
├── src/
│   ├── app/                  # Next.js app directory
│   │   ├── api/             # API routes
│   │   ├── auth/            # Authentication pages and callback
│   │   └── page.tsx         # Main application page
│   ├── components/          # React components
│   │   ├── ui/              # Reusable UI components
│   │   ├── capture-input.tsx
│   │   ├── link-list.tsx
│   │   └── user-button.tsx
│   ├── lib/                 # Utility functions
│   │   ├── supabase/        # Supabase client utilities
│   │   ├── metadata.ts      # Metadata extraction
│   │   └── utils.ts         # Helper functions
│   └── types/               # TypeScript types
├── supabase/
│   ├── schema.sql           # Database schema
│   └── README.md            # Supabase setup guide
├── SETUP.md                 # Detailed setup instructions
└── README.md                # This file
```

## Future Features

- 🤖 AI summaries for saved links
- 🏷️ Auto-tagging with AI
- 📂 Category management UI
- 🌐 Browser extension (Chrome & Firefox)
- 📱 iOS Shortcut
- 💻 Raycast command
- 🎥 YouTube video summarization
- 🔍 Full-text search
- 📡 AI-powered RSS feeds

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

If you encounter any issues:
1. Check the [Setup Guide](./SETUP.md)
2. Review the database schema in `supabase/schema.sql`
3. Verify your environment variables in `.env.local`

## Built With

This project follows modern React and Next.js best practices:
- Functional components with TypeScript
- Server Components where possible
- Client Components only when necessary
- Tailwind CSS for styling
- Clean, readable code structure

---

## Production Deployment

When deploying to Vercel:
1. Set the `NEXT_PUBLIC_SITE_URL` environment variable to your production domain (e.g., `https://vault-theta-lac.vercel.app`)
2. This ensures authentication redirects work correctly and don't point to localhost
3. See [SETUP.md](./SETUP.md) for detailed deployment instructions
