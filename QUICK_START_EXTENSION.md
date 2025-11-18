# Quick Start: Chrome Extension

Get the Vault Chrome extension up and running in 5 minutes.

## Prerequisites

✅ Vault web app running on `http://localhost:3000`
✅ Supabase database set up with user account

## Step 1: Run Database Migration

1. Open your Supabase SQL Editor
2. Copy and paste the contents of `supabase/migrations/001_create_api_tokens_table.sql`
3. Click "Run"

This creates the `api_tokens` table needed for extension authentication.

## Step 2: Install Extension Dependencies

```bash
# From project root
npm run extension:install
```

## Step 3: Build Extension

```bash
# Production build
npm run extension:build

# OR development with watch mode
npm run extension:dev
```

## Step 4: Load Extension in Chrome

1. Open Chrome
2. Navigate to `chrome://extensions/`
3. Enable **"Developer mode"** (toggle in top right)
4. Click **"Load unpacked"**
5. Navigate to your project folder
6. Select the `extension/dist` folder
7. Click **"Select Folder"**

The extension should now appear with a temporary icon.

## Step 5: Generate API Token

1. Open your Vault web app: `http://localhost:3000`
2. Click your **profile icon** (top right)
3. Select **"API Tokens"**
4. Click **"Generate New Token"**
5. Enter a name: `Chrome Extension`
6. **Copy the token** (you'll only see it once!)

## Step 6: Configure Extension

1. Click the **Vault extension icon** in Chrome toolbar
2. Click the **settings icon** (or right-click → Options)
3. Enter:
   - **Vault URL:** `http://localhost:3000`
   - **API Token:** Paste the token you copied
4. Click **"Save Settings"**
5. Click **"Test Connection"**
6. You should see: ✅ **"Connection successful!"**

## Step 7: Test It!

### Method 1: Extension Icon
1. Navigate to any website (e.g., `https://github.com`)
2. Click the Vault extension icon
3. Click "Save to Vault"
4. Look for success notification

### Method 2: Context Menu
1. Navigate to any website
2. Right-click anywhere on the page
3. Click "Save to Vault"

### Method 3: Keyboard Shortcut
1. Navigate to any website
2. Press:
   - **Mac:** `Cmd + Shift + S`
   - **Windows/Linux:** `Ctrl + Shift + S`

### Verify
Open your Vault web app and verify the links appear!

## Troubleshooting

### Extension Won't Load
- Make sure you selected the `extension/dist` folder, not just `extension`
- Rebuild: `npm run extension:build`
- Try reloading: click "Reload" in `chrome://extensions/`

### "No API token configured"
- Go to extension options (right-click icon → Options)
- Make sure both Vault URL and API Token are entered
- Click "Save Settings"

### "Connection failed"
- Check that Vault web app is running: `npm run dev`
- Verify URL is correct: `http://localhost:3000`
- Check browser console for CORS errors
- Verify API token is valid (test in web app settings)

### Token Not Working
- Token might have been revoked
- Generate a new token in web app
- Update extension settings with new token

## Production Deployment

When deploying to production:

1. **Update Vault URL** in extension options
2. **Update host_permissions** in `extension/manifest.json`:
   ```json
   "host_permissions": [
     "https://your-vault-domain.com/*"
   ]
   ```
3. **Rebuild extension:** `npm run extension:build`
4. **Create proper icons** in `extension/public/icons/`
5. **Test thoroughly** with production environment
6. **Submit to Chrome Web Store**

## Next Steps

- 📖 Read [EXTENSION_SETUP.md](./EXTENSION_SETUP.md) for detailed documentation
- 🧪 Follow [extension/TESTING.md](./extension/TESTING.md) for comprehensive testing
- 🎨 Create proper extension icons (see `extension/public/icons/README.md`)
- 🚀 Deploy to production and submit to Chrome Web Store

## Usage Tips

### Keyboard Shortcuts
- Save current page: `Cmd/Ctrl + Shift + S`
- Focus extension popup: Click icon
- Customize shortcuts: `chrome://extensions/shortcuts`

### Token Management
- Create different tokens for different devices
- Revoke tokens you're not using
- Monitor "Last used" timestamps
- Generate new token if compromised

### Best Practices
- Don't share your API token
- Use descriptive names for tokens
- Test connection after setup
- Check web app to verify saves

## Features Summary

✅ **One-click save** from any webpage
✅ **Three save methods**: Icon, context menu, keyboard
✅ **Secure authentication** with API tokens
✅ **Beautiful UI** with status feedback
✅ **Settings page** with connection testing
✅ **Browser notifications** for confirmations
✅ **Error handling** for network issues
✅ **Token revocation** from web app

## Support

- Check [EXTENSION_SETUP.md](./EXTENSION_SETUP.md) for development guide
- Check [extension/TESTING.md](./extension/TESTING.md) for testing scenarios
- Check browser console for error messages
- Check extension service worker console for background errors

Enjoy saving links from anywhere on the web! 🎉

