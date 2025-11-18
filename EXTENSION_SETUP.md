# Chrome Extension Setup & Development Guide

This guide explains how to set up and develop the Vault Chrome extension.

## Quick Start

```bash
# 1. Install extension dependencies
npm run extension:install

# 2. Build the extension
npm run extension:build

# 3. Load in Chrome
# - Open chrome://extensions/
# - Enable "Developer mode"
# - Click "Load unpacked"
# - Select the extension/dist folder
```

## Project Structure

```
vault/
├── extension/                  # Chrome extension (monorepo)
│   ├── src/
│   │   ├── background.ts      # Service worker
│   │   ├── content.ts         # Content script
│   │   ├── popup/             # Extension popup
│   │   ├── options/           # Settings page
│   │   └── lib/               # Shared utilities
│   ├── public/                # Static assets
│   ├── dist/                  # Build output (git-ignored)
│   ├── manifest.json          # Extension manifest
│   ├── webpack.config.js      # Build configuration
│   └── package.json
│
├── src/                       # Main web app
│   ├── app/api/auth/tokens/  # Token management API
│   ├── app/settings/          # Settings pages
│   └── lib/auth-middleware.ts # Bearer token auth
│
└── supabase/migrations/       # Database migrations
    └── 001_create_api_tokens_table.sql
```

## Development Workflow

### 1. Run Web App

```bash
npm run dev
```

The Vault web app will start on `http://localhost:3000`

### 2. Build Extension (Watch Mode)

```bash
npm run extension:dev
```

This will:
- Build the extension
- Watch for file changes
- Auto-rebuild on changes

### 3. Load Extension

1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select `vault/extension/dist` folder

### 4. Reload After Changes

After making code changes:
1. The build will auto-update (if using watch mode)
2. Go to `chrome://extensions/`
3. Click "Reload" icon on Vault extension
4. Test your changes

## Key Features

### Authentication
- **Method:** API token (Bearer authentication)
- **Storage:** Chrome sync storage
- **Generation:** From web app settings

### Supported Actions
1. **Save Current Page**
   - Click extension icon
   - Right-click → "Save to Vault"
   - Keyboard shortcut: `Cmd+Shift+S` (Mac) or `Ctrl+Shift+S` (Windows/Linux)

### Components

#### Background Service Worker (`background.ts`)
- Handles keyboard shortcuts
- Manages context menu
- Sends notifications
- Communicates with Vault API

#### Popup (`popup/`)
- Shows current page info
- Quick save button
- Link to settings
- Status messages

#### Options Page (`options/`)
- API token configuration
- Vault URL setup
- Connection testing
- Keyboard shortcuts info

#### API Client (`lib/api-client.ts`)
- Handles API requests to Vault
- Bearer token authentication
- Error handling

#### Storage (`lib/storage.ts`)
- Chrome storage wrapper
- Settings management
- Token retrieval

## API Token Flow

### Web App Side

1. **Create Token API** (`/api/auth/tokens`)
   - POST: Generate new token
   - GET: List tokens
   - DELETE: Revoke token

2. **Token Storage**
   - Tokens hashed with SHA-256
   - Stored in `api_tokens` table
   - Associated with user ID

3. **Authentication Middleware** (`lib/auth-middleware.ts`)
   - Checks Bearer token in Authorization header
   - Falls back to session cookies
   - Updates last_used_at timestamp

### Extension Side

1. **User generates token** in web app settings
2. **Copies token** (shown only once)
3. **Pastes in extension** options page
4. **Extension stores** in Chrome sync storage
5. **All API requests** include Bearer token

## Building for Production

```bash
# Build optimized version
npm run extension:build

# Output will be in extension/dist/
```

### Prepare for Chrome Web Store

1. Build production version
2. Create a `.zip` of `extension/dist` folder
3. Update version in `manifest.json`
4. Create promotional images (required by Chrome Web Store)
5. Submit to Chrome Web Store

## Configuration

### Manifest Settings (`manifest.json`)

- **Permissions:**
  - `activeTab` - Access current tab
  - `contextMenus` - Add context menu items
  - `storage` - Store settings
  - `notifications` - Show notifications

- **Host Permissions:**
  - Add your production Vault URL here

### Environment-Specific Settings

For local development:
```
Vault URL: http://localhost:3000
```

For production:
```
Vault URL: https://vault.yourdomain.com
```

Update `host_permissions` in manifest.json for production.

## Debugging

### Service Worker Console
```
chrome://extensions/ → Vault → "service worker" link
```

### Popup DevTools
```
Right-click extension icon → Inspect popup
```

### Options Page DevTools
```
Right-click options page → Inspect
```

### Storage Inspector
```
chrome://extensions/ → Vault → "Details" → "Storage"
```

## Common Development Tasks

### Add New Icon
1. Add PNG files to `extension/public/icons/`
2. Sizes needed: 16x16, 48x48, 128x128
3. Update `manifest.json` if needed
4. Rebuild extension

### Add New Permission
1. Update `permissions` in `manifest.json`
2. Rebuild extension
3. Reload in Chrome
4. Chrome will prompt user to accept new permissions

### Add New API Endpoint
1. Create route in `src/app/api/`
2. Use `authenticateRequest()` middleware
3. Test with Postman/curl using Bearer token
4. Update extension API client

### Share Types Between App and Extension
1. Define types in `src/types/`
2. Import in extension using `@shared/` alias
3. TypeScript will validate across both codebases

## Troubleshooting

### Extension Won't Load
- Check you selected `dist` folder, not root `extension` folder
- Look for errors in `chrome://extensions/` page
- Rebuild: `npm run extension:build`

### API Calls Failing
- Check Vault app is running
- Verify API token is valid
- Check browser console for CORS errors
- Verify `host_permissions` includes your Vault URL

### Changes Not Appearing
- Rebuild extension
- Click "Reload" in chrome://extensions/
- Hard refresh popup (Cmd+Shift+R on options page)

### TypeScript Errors
- Check `tsconfig.json` paths are correct
- Ensure types are exported from source files
- Run `npm install` in extension folder

## Testing

See `extension/TESTING.md` for comprehensive testing guide.

Quick test:
```bash
# 1. Start web app
npm run dev

# 2. Build extension
npm run extension:build

# 3. Load in Chrome and test saving a link
```

## Future Enhancements

**Planned Features:**
- Capture selected text as quotes
- Save images from pages
- Code snippet detection
- Batch capture multiple items
- Offline queue
- Category selection in popup
- Tag suggestions

**Technical Improvements:**
- Unit tests for extension code
- E2E tests with Playwright
- CI/CD for extension builds
- Automatic Chrome Web Store deployment

## Resources

- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Migration](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)

