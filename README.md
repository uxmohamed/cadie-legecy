# Cadie

A modern, keyboard-friendly read-it-later application with Chrome extension and automatic metadata extraction. Save links and colors with a beautiful, minimal interface.

## Features

### Core Functionality

- 🔗 **Link Management** - Save and organize web links with automatic metadata extraction
- 🎨 **Color Palette** - Save and organize colors in any format (hex, rgb, hsl, oklch, etc.)
- 🏷️ **Smart Organization** - Organize with categories and tags
- 🔍 **Powerful Search** - Instant search across all your saved items
- 📌 **Pin Important Items** - Keep frequently accessed items at the top
- 🗑️ **Trash & Archive** - Safely delete items with 60-day recovery period

### Chrome Extension

- 🧩 **One-Click Save** - Save any webpage from anywhere
- 🔑 **Secure Authorization** - API token-based authentication
- 🎨 **Context Menu Integration** - Right-click to save links, images, or text
- 🚀 **Instant Sync** - Links appear immediately in your dashboard
- ⚙️ **Settings Management** - Easy setup and configuration

### Organization & Management

- 🗂️ **Archive** - Archive items you've read or processed
- 🗑️ **Delete** - Remove items permanently
- ✏️ **Edit** - Update titles, descriptions, and content
- 📋 **Copy URLs** - Quick copy to clipboard
- ⌨️ **Keyboard Shortcuts** - Full keyboard navigation

### User Experience

- 🎨 **Clean Design** - Minimal, Linear/Craft-inspired interface
- 📱 **Fully Responsive** - Works beautifully on all devices
- ⚡ **Optimistic UI** - Instant feedback with optimistic updates
- 🌓 **Modern UI Components** - Built with Radix UI and Tailwind CSS

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or pnpm
- Supabase account (free tier)

### Installation

1. **Clone the repository**

```bash
git clone <your-repo-url>
cd cadie
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up Supabase**

   - Create a new project at [supabase.com](https://supabase.com)
   - Run the migrations in `supabase/migrations/`
   - Get your project URL and anon key

4. **Configure environment variables**

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

For production, update `NEXT_PUBLIC_SITE_URL` to your deployed domain.

5. **Run the development server**

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Chrome Extension Setup

1. **Build the extension**

```bash
npm run extension:build
```

2. **Load in Chrome**

   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `extension/dist` directory

3. **Authorize the extension**
   - Click the Cadie extension icon
   - Follow the authorization flow
   - Your extension is ready to use!

For detailed extension setup, see the extension's README in the `extension/` directory.

## ⌨️ Keyboard Shortcuts

### Main App

- `Cmd/Ctrl + F` - Focus search input
- `↑/↓` - Navigate through links
- `Home` - Jump to first link
- `End` - Jump to last link
- `Enter` - Open selected link in new tab
- `Escape` - Clear input and blur

## 📁 Project Structure

```
cadie/
├── src/
│   ├── app/                        # Next.js app directory
│   │   ├── api/                   # API routes
│   │   │   ├── auth/             # Auth-related endpoints
│   │   │   ├── categories/       # Category management
│   │   │   ├── extension/        # Extension authorization
│   │   │   ├── links/            # Link CRUD operations
│   │   │   ├── metadata/         # Metadata extraction
│   │   ├── auth/                 # Authentication pages
│   │   ├── extension/            # Extension authorization UI
│   │   ├── settings/             # Settings pages (API tokens)
│   │   └── page.tsx              # Main dashboard
│   ├── components/
│   │   ├── ui/                   # Reusable UI components (40+)
│   │   ├── capture-input.tsx     # Smart input for URLs/colors
│   │   ├── link-list.tsx         # Main list component
│   │   └── user-menu.tsx         # User menu with settings
│   ├── lib/
│   │   ├── supabase/             # Supabase clients
│   │   ├── api-utils.ts          # API helper functions
│   │   ├── auth-middleware.ts    # Authentication middleware
│   │   ├── canonicalize.ts       # URL canonicalization
│   │   ├── content-detector.ts   # Smart content type detection
│   │   └── metadata.ts           # Metadata extraction
│   └── types/                    # TypeScript type definitions
├── extension/                     # Chrome extension
│   ├── src/
│   │   ├── background.ts         # Service worker
│   │   ├── content.ts            # Content script
│   │   ├── popup/                # Extension popup
│   │   ├── options/              # Extension settings
│   │   └── lib/                  # Shared utilities
│   └── dist/                     # Built extension (load this in Chrome)
├── supabase/
│   └── migrations/               # Database migrations
└── public/                       # Static assets
```

## 🛠️ Tech Stack

### Frontend

- **Framework**: Next.js 15 (App Router) with React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React
- **Notifications**: Sonner (toast)

### Backend

- **Authentication**: Supabase Auth (OTP/Magic Links)
- **Database**: Supabase (PostgreSQL with RLS)
- **API**: Next.js API Routes
- **Metadata**: Cheerio for HTML parsing

### Extension

- **Platform**: Chrome Extension Manifest V3
- **Build**: Webpack 5
- **Language**: TypeScript

### Development

- **Linting**: ESLint 9
- **Package Manager**: npm/pnpm

## 🔐 Security

- **Row Level Security** - Database-level access control
- **API Token Authentication** - Secure extension-to-server communication
- **No Third-party Trackers** - Your data is only stored in your Supabase instance
- **Environment Variables** - Sensitive data never committed to git

## 📊 Analytics with PostHog

Cadie includes PostHog analytics integration for both client-side and server-side tracking. All analytics data is sent to your own PostHog project.

### Setup

1. **Create a PostHog account** at [posthog.com](https://posthog.com) (free tier available)

2. **Add environment variables** to `.env.local`:

```env
NEXT_PUBLIC_POSTHOG_KEY=your-posthog-project-key
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com  # or your PostHog instance URL
```

3. **Deploy environment variables** to your hosting provider (Vercel, Netlify, etc.)

### Client-Side Tracking

PostHog is initialized automatically via `instrumentation-client.ts` using Next.js 15.3+ instrumentation API. It captures pageviews, page leaves, and custom events.

**What Gets Tracked Automatically:**

- Page views and navigation
- Page leave events (for time-on-page metrics)
- Link actions (archive, delete, pin)
- User interactions with relevant metadata

**Manual Event Tracking:**

Import `posthog` directly from `posthog-js` or use the helper functions:

```typescript
import posthog from "posthog-js";

// Direct usage
posthog.capture("button_clicked", { button_name: "save" });

// Or use typed helpers
import { trackLinkSaved } from "@/lib/posthog-client";

trackLinkSaved({
  link_id: link.id,
  url: link.url,
  domain: link.domain,
  content_type: link.content_type,
});
```

**Available Client-Side Helpers:**

- `trackLinkSaved()`, `trackLinkArchived()`, `trackLinkDeleted()`
- `trackLinkFavorited()`, `trackLinkUpdated()`
- `trackCategoryCreated()`, `trackSearch()`
- `trackExtensionAuthStarted()`, `trackExtensionAuthCompleted()`
- `identifyUser()` - Identify a user with properties
- `trackEvent()` - Generic event tracking

### Server-Side Analytics

Use the `posthog-node` SDK for server-side tracking in API routes and server components:

```typescript
import { PostHogClient } from "@/lib/posthog-server";

export async function GET(request: Request) {
  const posthog = PostHogClient();

  try {
    // Capture server-side event
    posthog.capture({
      distinctId: "user_123",
      event: "api_called",
      properties: { endpoint: "/api/example" },
    });

    // Fetch feature flags
    const flags = await posthog.getAllFlags("user_123");

    // Always shutdown to flush events
    await posthog.shutdown();

    return Response.json({ success: true });
  } catch (error) {
    await posthog.shutdown();
    throw error;
  }
}
```

**Important:** Always call `await posthog.shutdown()` after capturing events to ensure they're sent before the serverless function terminates.

### Verification

1. **Start the dev server**: `npm run dev`
2. **Check browser console** - Look for PostHog initialization
3. **Interact with the app** - Archive or delete a link
4. **Visit PostHog dashboard** - Check Live View for real-time events
5. **Test server-side** - Visit `/api/analytics/example` to see server tracking

### Privacy & Data Control

- Analytics only runs when `NEXT_PUBLIC_POSTHOG_KEY` is set
- All data is stored in your PostHog instance
- No data is sent to third parties
- You have full control over what events are tracked
- PostHog respects user privacy preferences and GDPR compliance

## 🎯 API Tokens

The app includes API token management for secure extension authentication:

1. Navigate to Settings → API Tokens
2. Create a new token with a descriptive name
3. Copy the token (it's only shown once)
4. Use it to authorize the Chrome extension
5. Revoke tokens anytime from the settings page

## 📦 Available Scripts

### Main App

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
```

### Extension

```bash
npm run extension:dev        # Watch mode for development
npm run extension:build      # Build for production
npm run extension:install    # Install extension dependencies
```

## 🚀 Deployment

### Cloudflare Pages

1. **Push to GitHub**
2. **Import to Cloudflare Pages**
3. **Set environment variables**:
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   NEXT_PUBLIC_SITE_URL (your production domain)
   ```
4. **Deploy**

The app is optimized for Vercel with automatic deployments on push.

## 🗺️ Roadmap

### Planned Features

- 📂 **Visual Category Management** - UI for organizing links
- 🔍 **Full-text Search** - Search through page content
- 📊 **Analytics** - Track reading habits and saved items
- 🤖 **AI Summaries** - Automatic summarization of saved articles
- 🏷️ **Auto-tagging with AI** - Smart categorization
- 📱 **iOS Shortcut** - Save from iOS devices
- 💻 **Raycast Extension** - Quick access from Raycast
- 🎥 **YouTube Integration** - Save and summarize videos
- 📡 **RSS Feed Support** - Import from RSS feeds
- 🔄 **Sync Highlights** - Save and sync highlighted text
- 🌙 **Dark Mode** - Full dark mode support

### Recently Completed

- ✅ Chrome Extension with full authentication
- ✅ API token management
- ✅ Pin/unpin functionality
- ✅ Archive functionality
- ✅ Color saving
- ✅ Smart content detection
- ✅ Optimistic UI updates
- ✅ Migration from Clerk to Supabase Auth

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 💡 Tips & Tricks

- **Multi-paste**: Paste multiple URLs at once (one per line) to save them all
- **Color Detection**: Paste any color format (HEX, RGB, HSL) and it will be detected automatically
- **Quick Archive**: Use the archive button to hide links you've read without deleting them
- **Pin Important**: Pin frequently accessed links to keep them at the top
- **Keyboard Power User**: Use arrow keys and Enter to navigate without touching your mouse
- **Extension Saves Everything**: Right-click on any link, image, or selection to save it

## 🆘 Support & Troubleshooting

### Common Issues

**Authentication not working?**

- Check your Supabase credentials in `.env.local`
- Verify your Supabase project is running
- Check the browser console for errors

**Extension not connecting?**

- Make sure you've created an API token in Settings
- Verify the token was entered correctly
- Check that your app URL is accessible

**Metadata not loading?**

- Some websites block metadata scraping
- CORS restrictions may prevent fetching
- Check the browser console for errors

### Getting Help

1. Check existing GitHub issues
2. Review the code comments for implementation details
3. Open a new issue with detailed information

---

**Built with ❤️ using Next.js and Supabase**
