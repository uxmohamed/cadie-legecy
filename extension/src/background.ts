/**
 * Background service worker for Caddy extension
 * Handles context menus, keyboard shortcuts, and notifications
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
  chrome.contextMenus.create({
    id: "save-to-caddy",
    title: "Save to Caddy",
    contexts: ["page", "link", "selection"],
  });
});

// Context menu click listener
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "save-to-caddy" && tab?.id) {
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

  if (request.action === "showNotification") {
    showNotification(request.title, request.message, request.type);
    sendResponse({ success: true });
    return true;
  }

  // Handle authorization success from content script
  if (request.type === "CADDY_AUTH_SUCCESS" && request.data) {
    const { token, email, url, caddyUrl, state } = request.data;

    // Use the provided URL, or try to get it from the sender tab
    let caddyUrlToUse = url || caddyUrl;

    // If no URL provided, try to get it from the sender tab
    if (!caddyUrlToUse && sender?.tab?.url) {
      try {
        const tabUrl = new URL(sender.tab.url);
        caddyUrlToUse = `${tabUrl.protocol}//${tabUrl.host}`;
      } catch (e) {
        console.error("Error parsing sender URL:", e);
      }
    }

    // Fallback to production URL if we really can't determine the URL
    if (!caddyUrlToUse) {
      caddyUrlToUse = "https://caddy-ed0.pages.dev";
    }

    // Save settings directly to storage
    chrome.storage.sync.set({
      apiToken: token,
      caddyUrl: caddyUrlToUse,
      userEmail: email || "",
    }, () => {
      // Notify any open options pages that auth completed
      chrome.runtime.sendMessage({
        type: "CADDY_AUTH_COMPLETE",
        data: { caddyUrl: caddyUrlToUse },
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
 * Save the current tab to Caddy
 */
async function saveCurrentTab(tabId: number): Promise<void> {
  try {
    // Check if token is configured
    const token = await getApiToken();
    if (!token) {
      showNotification(
        "Configuration Required",
        "Please configure your API token in extension settings",
        "error"
      );
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
      return;
    }

    // Don't save chrome:// or extension pages
    if (
      tab.url.startsWith("chrome://") ||
      tab.url.startsWith("chrome-extension://") ||
      tab.url.startsWith("about:")
    ) {
      showOverlayInTab(tabId, "error", "Cannot save internal browser pages");
      return;
    }

    // Show loading overlay immediately (fast feedback)
    showOverlayInTab(tabId, "loading");

    // Save to Caddy
    const response = await saveLink({
      url: tab.url,
      title: tab.title,
      content_type: "url",
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
      showOverlayInTab(tabId, "error", response.error || "Unknown error occurred");
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

      // Auto-clear after 5 seconds as a safety measure
      setTimeout(() => {
        savesInProgress.delete(saveKey);
      }, 5000);
    }
  }
}

/**
 * Show overlay in tab
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
    // Content script might not be loaded, fall back to notification
    if (state === "success") {
      showNotification("Saved to Caddy! ✨", "Page saved successfully", "success");
    } else if (state === "duplicate") {
      showNotification("Already in Caddy!", "This page was already saved", "info");
    } else if (state === "error") {
      showNotification("Error", message || "Failed to save", "error");
    }
  });
}

/**
 * Show a notification to the user
 */
function showNotification(
  title: string,
  message: string,
  type: "info" | "success" | "error" = "info"
): string {
  const iconUrl = chrome.runtime.getURL("icons/icon-48.png");
  const notificationId = `caddy-${Date.now()}`;

  chrome.notifications.create(notificationId, {
    type: "basic",
    iconUrl,
    title,
    message,
    priority: 1,
  });

  // Auto-dismiss success/info notifications after 3 seconds
  if (type !== "error") {
    setTimeout(() => {
      chrome.notifications.clear(notificationId);
    }, 3000);
  }

  return notificationId;
}
