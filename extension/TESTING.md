# Extension Testing Guide

This guide walks through testing the Vault Chrome extension end-to-end.

## Prerequisites

1. **Running Vault Web App**
   ```bash
   # From project root
   npm run dev
   ```
   The app should be running on `http://localhost:3000`

2. **Database Setup**
   - Run the migration: `supabase/migrations/001_create_api_tokens_table.sql`
   - Ensure you have a user account created

3. **Built Extension**
   ```bash
   # From project root
   npm run extension:install  # First time only
   npm run extension:build    # Build for production
   # OR
   npm run extension:dev      # Build with watch mode
   ```

## Setup Process

### 1. Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right corner)
3. Click "Load unpacked"
4. Navigate to `extension/dist` folder in your project
5. Click "Select Folder"

The extension should now appear in your extensions list.

### 2. Generate API Token

1. Open your Vault web app (`http://localhost:3000`)
2. Log in with your account
3. Click your profile icon (top right)
4. Select "API Tokens" from the dropdown
5. Click "Generate New Token"
6. Enter a name: `Chrome Extension Test`
7. Copy the generated token (you'll only see it once!)

### 3. Configure Extension

1. Right-click the Vault extension icon in Chrome toolbar
2. Select "Options" (or click Settings icon in popup)
3. Enter your settings:
   - **Vault URL:** `http://localhost:3000`
   - **API Token:** Paste the token you copied
4. Click "Save Settings"
5. Click "Test Connection" to verify it works
6. You should see "Connection successful!"

## Testing Scenarios

### Test 1: Save via Extension Icon

1. Navigate to any website (e.g., `https://github.com`)
2. Click the Vault extension icon
3. Verify popup shows:
   - Page title
   - Page URL
   - "Save to Vault" button (enabled)
4. Click "Save to Vault"
5. Wait for confirmation: "Saved to Vault!"
6. Open Vault web app and verify the link appears

**Expected Result:** ✅ Link saved successfully

### Test 2: Save via Context Menu

1. Navigate to any website
2. Right-click anywhere on the page
3. Click "Save to Vault" from context menu
4. Look for browser notification: "Saved to Vault!"
5. Check Vault web app to verify

**Expected Result:** ✅ Link saved via context menu

### Test 3: Save via Keyboard Shortcut

1. Navigate to any website
2. Press:
   - Mac: `Cmd + Shift + S`
   - Windows/Linux: `Ctrl + Shift + S`
3. Look for notification: "Saved to Vault!"
4. Verify in web app

**Expected Result:** ✅ Link saved via keyboard shortcut

### Test 4: Duplicate Detection

1. Save a link using any method
2. Try to save the same link again
3. Verify web app shows only one instance

**Expected Result:** ✅ Duplicate detection works (handled by web app)

### Test 5: Invalid URLs

1. Try to save from:
   - `chrome://extensions/`
   - `chrome://settings/`
2. Extension should show error: "Cannot save internal browser pages"

**Expected Result:** ✅ Internal pages blocked correctly

### Test 6: No Token Configured

1. Clear your API token in extension settings
2. Try to save a page
3. Should see: "Please configure your API token in settings"
4. Should auto-open settings page

**Expected Result:** ✅ Proper error handling

### Test 7: Invalid Token

1. Enter a fake/invalid token in settings
2. Click "Test Connection"
3. Should see: "Invalid API token"
4. Try to save a page
5. Should see error notification

**Expected Result:** ✅ Invalid token detected

### Test 8: Network Error

1. Stop the Vault web app (`Ctrl+C` in terminal)
2. Try to save a page
3. Should see network error notification
4. Restart web app
5. Save should work again

**Expected Result:** ✅ Network errors handled gracefully

## Common Issues

### Extension Not Loading
- Check that you selected the `dist` folder, not the `extension` folder
- Rebuild: `npm run extension:build`
- Click "Reload" button on extension in `chrome://extensions/`

### "No API token configured"
- Verify token is saved in extension settings
- Open extension options and check both fields
- Re-enter token and save

### "Connection failed"
- Verify Vault web app is running on correct URL
- Check console in DevTools for errors
- Verify Supabase migration was run

### Token Shows in Web App But Not Working
- Token might have been revoked
- Generate a new token
- Update extension settings

### Changes Not Appearing
- Rebuild extension: `npm run extension:build`
- Click "Reload" in `chrome://extensions/`
- Hard refresh popup (right-click → Inspect → reload)

## Development Testing

For active development:

```bash
# Terminal 1: Run web app
npm run dev

# Terminal 2: Build extension with watch
npm run extension:dev
```

Whenever you make changes to extension code:
1. The build will automatically update
2. Go to `chrome://extensions/`
3. Click "Reload" on the Vault extension
4. Test your changes

## Debugging

### Background Service Worker
1. Go to `chrome://extensions/`
2. Find Vault extension
3. Click "service worker" link
4. Console logs will appear in DevTools

### Popup
1. Right-click extension icon
2. Select "Inspect popup"
3. DevTools will open for popup

### Options Page
1. Right-click extension icon → Options
2. Right-click on page → Inspect
3. DevTools will open for options page

## Success Criteria

All tests pass if:
- ✅ Extension loads without errors
- ✅ Settings save and persist
- ✅ Connection test succeeds
- ✅ Links save via all three methods (icon, context menu, keyboard)
- ✅ Notifications appear correctly
- ✅ Links appear in web app
- ✅ Error cases handled gracefully
- ✅ Invalid URLs rejected

## Next Steps

After basic testing passes:
1. Test with production Vault URL
2. Test token revocation workflow
3. Test with multiple tokens
4. Test extension updates
5. Prepare for Chrome Web Store submission

## Reporting Issues

If you find bugs during testing:
1. Check browser console for errors
2. Check extension service worker console
3. Note the exact steps to reproduce
4. Check network tab for failed API calls
5. Document expected vs actual behavior

