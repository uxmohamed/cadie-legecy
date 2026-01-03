/**
 * Background service worker for Cadie extension
 * Handles context menus, keyboard shortcuts, and saving links
 */

import { saveLink } from "./lib/api-client";
import { getApiToken } from "./lib/storage";

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
    await saveCurrentTab(tab.id);
  }
});

// Extension icon/keyboard shortcut click listener - save page directly
chrome.action.onClicked.addListener(async (tab) => {
  if (tab?.id) {
    await saveCurrentTab(tab.id);
  }
});

// Message listener - Handle messages from popup/content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "saveCurrentTab") {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs[0]?.id) {
        await saveCurrentTab(tabs[0].id);
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: "No active tab" });
      }
    });
    return true; // Keep message channel open for async response
  }

  // Handle authorization success from content script
  if (request.type === "CADIE_AUTH_SUCCESS" && request.data) {
    const { token, email, url, cadieUrl } = request.data;

    // Always use production URL for the extension
    // The token is generated against cadie.app, so we must use that for API calls
    const cadieUrlToUse = "https://cadie.app";

    // Save settings directly to storage
    chrome.storage.sync.set({
      apiToken: token,
      cadieUrl: cadieUrlToUse,
      userEmail: email || "",
    }, () => {
      // Notify any open options pages that auth completed
      chrome.runtime.sendMessage({
        type: "CADIE_AUTH_COMPLETE",
        data: { cadieUrl: cadieUrlToUse },
      }).catch(() => {
        // Options page might not be listening, that's okay
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
 * Save the current tab to Cadie
 */
async function saveCurrentTab(tabId: number): Promise<void> {
  try {
    // Check if token is configured
    const token = await getApiToken();
    if (!token) {
      // Silently open options page - no OS notification
      chrome.runtime.openOptionsPage();
      return;
    }

    // Get tab information
    const tab = await chrome.tabs.get(tabId);

    // Create a unique key for this save operation
    const saveKey = `${tab.url}`;

    // Check if we're already saving this URL
    if (savesInProgress.has(saveKey)) {
      return;
    }

    // Mark this URL as being saved
    savesInProgress.add(saveKey);

    if (!tab.url || !tab.title) {
      showOverlayInTab(tabId, "error", "Could not get page information");
      savesInProgress.delete(saveKey);
      return;
    }

    // Don't save chrome:// or extension pages
    if (
      tab.url.startsWith("chrome://") ||
      tab.url.startsWith("chrome-extension://") ||
      tab.url.startsWith("about:")
    ) {
      showOverlayInTab(tabId, "error", "Cannot save browser pages");
      savesInProgress.delete(saveKey);
      return;
    }

    // Show loading overlay immediately (fast feedback)
    showOverlayInTab(tabId, "loading");

    // Try to get page metadata from content script
    let metadata: {
      favicon_url?: string;
      og_image_url?: string;
      description?: string;
    } = {};

    try {
      metadata = await chrome.tabs.sendMessage(tabId, { action: "getPageMetadata" });
    } catch (e) {
      // Content script not available, continue without metadata
      // Use default favicon from URL origin
      try {
        const url = new URL(tab.url);
        metadata.favicon_url = `${url.origin}/favicon.ico`;
      } catch (e) {
        // Ignore
      }
    }

    // Save to Cadie with metadata
    const response = await saveLink({
      url: tab.url,
      title: tab.title,
      content_type: "url",
      favicon_url: metadata.favicon_url,
      og_image_url: metadata.og_image_url,
      description: metadata.description,
    });

    if (response.success) {
      // Show success overlay - different message for duplicates
      if (response.duplicate) {
        showOverlayInTab(tabId, "duplicate");
      } else {
        showOverlayInTab(tabId, "success");
      }
    } else {
      // Show error overlay
      showOverlayInTab(tabId, "error", response.error || "Failed to save");
    }
  } catch (error) {
    console.error("Error saving tab:", error);
    showOverlayInTab(
      tabId,
      "error",
      error instanceof Error ? error.message : "Failed to save"
    );
  } finally {
    // Always remove the save lock, even if there was an error
    const tab = await chrome.tabs.get(tabId).catch(() => null);
    if (tab?.url) {
      const saveKey = `${tab.url}`;
      savesInProgress.delete(saveKey);
    }
  }
}

/**
 * Show overlay in tab (in-page notification, not OS notification)
 */
function showOverlayInTab(
  tabId: number,
  state: "loading" | "success" | "error" | "duplicate",
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
