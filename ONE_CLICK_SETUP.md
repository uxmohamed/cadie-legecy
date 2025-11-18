# One-Click Extension Setup 🚀

The extension now has a **much simpler** setup flow! No more copying/pasting tokens.

## New Setup (Just 3 Steps!)

### 1. Reload Extension in Chrome

Since we updated the extension, reload it:

1. Go to `chrome://extensions/`
2. Find "Vault" extension
3. Click the **"Reload" icon** (circular arrow)

### 2. Click "Connect with Vault"

1. Click the Vault extension icon in your toolbar
2. Click **"Open Settings"** (since not connected yet)
3. Click the big **"Connect with Vault"** button

### 3. Authorize in Web App

1. A new tab opens with your Vault web app
2. If not logged in, log in first
3. Click **"Authorize Extension"**
4. Done! The authorization tab closes automatically

That's it! ✅ The extension is now connected and ready to use.

## What Changed?

### Before (Old Flow) 😫
1. Open web app
2. Go to settings
3. Click API Tokens
4. Generate token
5. Copy token
6. Open extension settings
7. Paste token
8. Save
9. Test connection

**9 steps, ~2 minutes**

### Now (New Flow) 🎉
1. Click "Connect with Vault"
2. Click "Authorize"
3. Done!

**2 clicks, ~10 seconds**

## How to Use

### Save Any Webpage

Three ways to save:

1. **Click Extension Icon** → Click "Save to Vault"
2. **Right-click Page** → "Save to Vault"
3. **Keyboard Shortcut** → `Cmd+Shift+S` (Mac) or `Ctrl+Shift+S` (Windows/Linux)

### Check Connection Status

- Open extension popup - shows "✅ Connected" if working
- Or open extension settings - shows your email and connection info

### Disconnect

If you want to disconnect:

1. Right-click extension icon → Options
2. Click "Disconnect" button
3. Confirm

You can reconnect anytime with one click!

## Troubleshooting

### "Connect with Vault" Button Does Nothing

**Solution:** Make sure your web app is running:
```bash
npm run dev
```

The extension tries to connect to `http://localhost:3000` by default.

### Authorization Page Shows "Not Logged In"

**Solution:** 
1. Log in to your Vault web app first
2. Then try connecting the extension again

### Still Want Manual Configuration?

The manual token flow is still available:

1. Open extension settings
2. Expand **"Advanced: Manual Configuration"**
3. Enter Vault URL and API token manually
4. Click "Save Settings"

This is useful for:
- Self-hosted Vault instances
- Custom URLs
- Multiple accounts

## Technical Details

### How It Works

1. Extension opens `/extension/authorize` page in web app
2. Web app checks if user is logged in
3. If yes, generates an API token automatically
4. Sends token back to extension via URL params
5. Extension saves token and shows "Connected"

### Security

- Token is generated server-side with user's session
- Token is sent only once during authorization
- Token is stored securely in Chrome sync storage
- You can revoke tokens anytime from web app settings

### For Self-Hosted Instances

If you're running Vault on a different URL:

1. Click "Connect with Vault"
2. Expand "Advanced: Manual Configuration"
3. Change Vault URL to your instance
4. Then use Connect button (it will use your custom URL)

Or just enter URL + token manually in advanced section.

## Next Steps

1. **Test It:** Navigate to any website and try saving it
2. **Check Vault:** Open your Vault web app and see the saved link
3. **Try Shortcuts:** Use `Cmd/Ctrl+Shift+S` for quick saves

Enjoy the simplified experience! 🎉

