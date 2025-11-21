# Caddy - Personal Knowledge Management System

A modern, keyboard-friendly read-it-later application with rich text editing, Chrome extension, and automatic metadata extraction. Save links, colors, and text notes with a beautiful, minimal interface.

## ✨ Current Features

### Core Functionality

- 🔐 **Secure Authentication** - Supabase OTP with magic link authentication
- 💾 **Personal Data Storage** - Your data stays in your own Supabase database with Row Level Security
- 🎯 **Auto Metadata Extraction** - Automatically fetches titles, descriptions, favicons, and OG images
- 🧹 **URL Cleaning** - Removes tracking parameters automatically
- 🔍 **Real-time Search** - Filter through your saved items instantly
- 📌 **Pin Important Items** - Keep your most important links at the top

### Content Types

- 🔗 **URLs** - Save any web link with automatic metadata enrichment
- 🎨 **Colors** - Save color palettes with visual previews
- 📝 **Rich Text Notes** - Full-featured rich text editor with auto-save

### Rich Text Editor (Lexical)

- **Text Formatting**: Bold, italic, underline, strikethrough, code
- **Headings**: H1, H2, H3
- **Lists**: Ordered and unordered lists
- **Links**: Insert and edit hyperlinks
- **Code Blocks**: Syntax-highlighted code with language selection
- **Block Formatting**: Quotes, paragraphs
- **Auto-save**: Changes save automatically as you type
- **Keyboard Shortcuts**: Full keyboard support for power users

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
cd caddy
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
   - Click the Caddy extension icon
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

### Rich Text Editor

- `Cmd/Ctrl + B` - Bold
- `Cmd/Ctrl + I` - Italic
- `Cmd/Ctrl + U` - Underline
- `Cmd/Ctrl + K` - Insert link
- `Cmd/Ctrl + Shift + 7` - Ordered list
- `Cmd/Ctrl + Shift + 8` - Unordered list
- `/` - Open slash command menu

## 📁 Project Structure

```
caddy/
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
│   │   ├── blocks/               # Complex feature blocks
│   │   │   └── editor-00/        # Rich text editor
│   │   ├── ui/                   # Reusable UI components (40+)
│   │   ├── capture-input.tsx     # Smart input for URLs/colors/text
│   │   ├── link-list.tsx         # Main list component
│   │   ├── rich-text-editor.tsx  # Lexical editor wrapper
│   │   └── user-menu.tsx         # User menu with settings
│   ├── lib/
│   │   ├── supabase/             # Supabase clients
│   │   ├── api-utils.ts          # API helper functions
│   │   ├── auth-middleware.ts    # Authentication middleware
│   │   ├── canonicalize.ts       # URL canonicalization
│   │   ├── content-detector.ts   # Smart content type detection
│   │   ├── metadata.ts           # Metadata extraction
│   │   └── rich-text-utils.ts    # Rich text helper functions
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
- **UI Components**: Radix UI, Base UI
- **Rich Text**: Lexical Editor
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

### Vercel (Recommended)

1. **Push to GitHub**
2. **Import to Vercel**
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
- 🔍 **Full-text Search** - Search through page content and notes
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
- ✅ Rich text editor with auto-save
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

**Built with ❤️ using Next.js, Supabase, and Lexical**
