/**
 * Background service worker for Vault extension
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
  console.log("Vault extension installed");
  chrome.contextMenus.create({
    id: "save-to-vault",
    title: "Save to Vault",
    contexts: ["page", "link", "selection"],
  });
});

// Context menu click listener
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  console.log("🖱️ Context menu clicked:", info.menuItemId);
  if (info.menuItemId === "save-to-vault" && tab?.id) {
    await saveCurrentTab(tab.id);
  }
});

// Extension icon/keyboard shortcut click listener - save page directly
chrome.action.onClicked.addListener(async (tab) => {
  console.log("🎯 Extension activated (icon click or keyboard shortcut)");
  if (tab?.id) {
    console.log("🚀 Saving current tab:", tab.id);
    await saveCurrentTab(tab.id);
  } else {
    console.error("❌ No active tab found");
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
  if (request.type === "VAULT_AUTH_SUCCESS" && request.data) {
    const { token, email, url, vaultUrl, state } = request.data;
    
    // Use the provided URL, or try to get it from the sender tab
    let vaultUrlToUse = url || vaultUrl;
    
    // If no URL provided, try to get it from the sender tab
    if (!vaultUrlToUse && sender?.tab?.url) {
      try {
        const tabUrl = new URL(sender.tab.url);
        vaultUrlToUse = `${tabUrl.protocol}//${tabUrl.host}`;
      } catch (e) {
        console.error("Error parsing sender URL:", e);
      }
    }
    
    // Fallback to localhost only if we really can't determine the URL
    if (!vaultUrlToUse) {
      console.warn("No vault URL provided, using localhost fallback");
      vaultUrlToUse = "http://localhost:3000";
    }
    
    // Construct options page URL with auth params
    const params = new URLSearchParams({
      authorized: "true",
      token: token,
      email: email || "",
      url: vaultUrlToUse,
      state: state || "",
    });
    
    const optionsUrl = chrome.runtime.getURL(`options.html?${params.toString()}`);
    
    // Open options page with auth data
    chrome.tabs.create({ url: optionsUrl });
    
    // Also notify the options page if it's open
    chrome.runtime.sendMessage({
      type: "VAULT_AUTH_COMPLETE",
      data: { vaultUrl: vaultUrlToUse },
    }).catch(() => {
      // Options page might not be listening, that's okay
    });
    
    sendResponse({ success: true });
    return true;
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Save the current tab to Vault
 */
async function saveCurrentTab(tabId: number): Promise<void> {
  console.log("💾 saveCurrentTab called for tab:", tabId);
  try {
    // Check if token is configured
    const token = await getApiToken();
    console.log("🔑 API Token check:", token ? "✅ Found" : "❌ Missing");
    if (!token) {
      console.warn("⚠️ No API token, opening settings");
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
      console.log("Already saving this URL, skipping duplicate request");
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
    console.log("📤 Showing loading overlay for tab:", tabId);
    showOverlayInTab(tabId, "loading");

    // Save to Vault
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
  console.log(`📨 Sending message to tab ${tabId}:`, { action: "showSaveOverlay", state, message });
  chrome.tabs.sendMessage(tabId, {
    action: "showSaveOverlay",
    state,
    message,
  }).then(() => {
    console.log("✅ Message sent successfully to tab:", tabId);
  }).catch((error) => {
    // Content script might not be loaded, fall back to notification
    console.error("❌ Could not show overlay, error:", error);
    console.log("🔔 Falling back to notification");
    if (state === "success") {
      showNotification("Saved to Vault! ✨", "Page saved successfully", "success");
    } else if (state === "duplicate") {
      showNotification("Already in Vault!", "This page was already saved", "info");
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
  const notificationId = `vault-${Date.now()}`;

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

// ============================================================================
// STARTUP / DIAGNOSTICS
// ============================================================================

console.log("🔥 Vault background service worker loaded - VERSION 3");

// Log registered commands for debugging
if (chrome.commands) {
  chrome.commands.getAll((commands) => {
    console.log("📋 Registered keyboard shortcuts:", commands);
  });
}
