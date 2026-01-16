/**
 * Background service worker for Cadie extension
 * Handles context menus, keyboard shortcuts, and saving links
 */

import { saveLink } from "./lib/api-client";
import { getApiToken, getPendingUrl, setPendingUrl, clearPendingUrl } from "./lib/storage";

// Track saves in progress to prevent duplicates
const savesInProgress = new Set<string>();

// ============================================================================
// EVENT LISTENERS - Register at top level for persistence across SW lifecycle
// ============================================================================

// Install listener - Create context menu
chrome.runtime.onInstalled.addListener(() => {
  // Remove any existing context menus first to prevent duplicate ID errors
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "save-to-cadie",
      title: "Save to Cadie",
      contexts: ["page", "link", "selection"],
    });
  });
});

// Context menu click listener
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "save-to-cadie" && tab?.id) {
    // Use linkUrl if right-clicking a link, otherwise use pageUrl or tab.url
    const urlToSave = info.linkUrl || info.pageUrl || tab.url;
    if (urlToSave) {
      await saveUrl(tab.id, urlToSave);
    }
  }
});

// Extension icon/keyboard shortcut click listener - save page directly
chrome.action.onClicked.addListener(async (tab) => {
  if (tab?.id && tab.url) {
    await saveUrl(tab.id, tab.url);
  }
});

// Message listener - Handle messages from popup/content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "saveCurrentTab") {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs[0]?.id && tabs[0].url) {
        await saveUrl(tabs[0].id, tabs[0].url);
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: "No active tab" });
      }
    });
    return true; // Keep message channel open for async response
  }

  // Handle open auth page request from content script
  if (request.action === "openAuthPage") {
    const extensionId = chrome.runtime.id;
    chrome.tabs.create({ url: `https://cadie.app/extension/authorize?extensionId=${extensionId}` });
    sendResponse({ success: true });
    return true;
  }

  // Handle authorization success from content script
  if (request.type === "CADIE_AUTH_SUCCESS" && request.data) {
    const { token, email } = request.data;

    // Always use production URL for the extension
    const cadieUrlToUse = "https://cadie.app";

    // Save API token to local storage (sensitive)
    chrome.storage.local.set({ apiToken: token }, () => {
      // Save non-sensitive settings to sync storage
      chrome.storage.sync.set({
        cadieUrl: cadieUrlToUse,
        userEmail: email || "",
      }, async () => {
        // Notify any open options pages that auth completed
        chrome.runtime.sendMessage({
          type: "CADIE_AUTH_COMPLETE",
          data: { cadieUrl: cadieUrlToUse },
        }).catch(() => {
          // Options page might not be listening, that's okay
        });

        // Check for pending URL to save after auth
        const pendingUrl = await getPendingUrl();
        if (pendingUrl) {
          await clearPendingUrl();
          // Get active tab and save the pending URL
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tab?.id) {
            await saveUrl(tab.id, pendingUrl);
          }
        }
      });
    });

    sendResponse({ success: true });
    return true;
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Save a URL to Cadie
 * @param tabId - The tab ID to show overlays in
 * @param url - The URL to save
 */
async function saveUrl(tabId: number, url: string): Promise<void> {
  // Create a unique key for this save operation
  const saveKey = url;

  // Check if we're already saving this URL
  if (savesInProgress.has(saveKey)) {
    return;
  }

  // Mark this URL as being saved
  savesInProgress.add(saveKey);

  try {
    // Don't save chrome:// or extension pages
    if (
      url.startsWith("chrome://") ||
      url.startsWith("chrome-extension://") ||
      url.startsWith("about:")
    ) {
      showOverlayInTab(tabId, "error", "Cannot save browser pages");
      return;
    }

    // Check if token is configured and valid (should be 43+ characters)
    const token = await getApiToken();

    if (!token || token.length < 32) {
      // Not connected - store the pending URL and show auth prompt overlay
      await setPendingUrl(url);
      showOverlayInTab(tabId, "auth-required");
      return;
    }

    // Show loading overlay immediately (fast feedback)
    showOverlayInTab(tabId, "loading");

    // Save to Cadie - only URL needed!
    // Server extracts title from domain, then enriches with full metadata via background job
    const response = await saveLink({ url });

    if (response.success) {
      // Show success overlay - different message for duplicates
      if (response.duplicate) {
        showOverlayInTab(tabId, "duplicate");
      } else {
        showOverlayInTab(tabId, "success");
      }
    } else {
      // Check if auth failed - store pending URL and show auth prompt
      if (response.authFailed) {
        await setPendingUrl(url);
        showOverlayInTab(tabId, "auth-required");
        return;
      }
      // Show error overlay for other errors
      showOverlayInTab(tabId, "error", response.error || "Failed to save");
    }
  } catch (error) {
    console.error("Error saving URL:", error);
    showOverlayInTab(
      tabId,
      "error",
      error instanceof Error ? error.message : "Failed to save"
    );
  } finally {
    // Always remove the save lock, even if there was an error
    savesInProgress.delete(saveKey);
  }
}

/**
 * Show overlay in tab (in-page notification, not OS notification)
 */
function showOverlayInTab(
  tabId: number,
  state: "loading" | "success" | "error" | "duplicate" | "auth-required",
  message?: string
): void {
  chrome.tabs.sendMessage(tabId, {
    action: "showSaveOverlay",
    state,
    message,
  }).catch(() => {
    // Content script not available on this page, silently ignore
  });
}
