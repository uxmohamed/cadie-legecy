# Vault Chrome Extension

Browser extension to save links, text, and colors to your Vault with one click.

## Development

### Setup

```bash
cd extension
npm install
```

### Build

Development build with watch mode:
```bash
npm run dev
```

Production build:
```bash
npm run build
```

### Loading the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `extension/dist` folder

### Configuration

1. Click the extension icon in Chrome toolbar
2. Click "Settings" or right-click → "Options"
3. Enter your API token from Vault settings
4. Save and test the connection

## Usage

### Save Current Page
- Click the extension icon
- OR use keyboard shortcut: `Ctrl+Shift+S` (Windows/Linux) or `Cmd+Shift+S` (Mac)
- OR right-click on page → "Save to Vault"

### Future Features
- Save selected text as quotes
- Save images
- Save code snippets
- Batch capture multiple items

## Project Structure

```
extension/
├── manifest.json       # Extension manifest (Manifest V3)
├── src/
│   ├── background.ts   # Service worker (handles context menu, shortcuts)
│   ├── content.ts      # Content script (future: page interaction)
│   ├── popup/          # Extension popup UI
│   │   ├── popup.html
│   │   ├── popup.ts
│   │   └── popup.css
│   ├── options/        # Settings page
│   │   ├── options.html
│   │   ├── options.ts
│   │   └── options.css
│   └── lib/
│       ├── api-client.ts   # Vault API client
│       └── storage.ts      # Chrome storage utilities
└── public/
    └── icons/          # Extension icons
```

## API Token

The extension requires an API token to authenticate with your Vault:

1. Log in to Vault web app
2. Click your profile → "API Tokens"
3. Click "Generate New Token"
4. Give it a name (e.g., "Chrome Extension")
5. Copy the token (you'll only see it once!)
6. Paste it in the extension settings

## Permissions

- `activeTab` - Access current tab URL and title
- `contextMenus` - Add right-click menu items
- `storage` - Store API token and settings
- `host_permissions` - Make API calls to Vault backend

