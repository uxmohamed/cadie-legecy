/**
 * Background service worker for Vault extension
 * Handles context menus, keyboard shortcuts, and notifications
 */

import { saveLink } from "./lib/api-client";
import { getApiToken } from "./lib/storage";

// Create context menu on installation
chrome.runtime.onInstalled.addListener(() => {
  console.log("Vault extension installed");

  // Create context menu item
  chrome.contextMenus.create({
    id: "save-to-vault",
    title: "Save to Vault",
    contexts: ["page", "link", "selection"],
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "save-to-vault") {
    if (tab?.id) {
      await saveCurrentTab(tab.id);
    }
  }
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "save-page") {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      await saveCurrentTab(tab.id);
    }
  }
});

// Note: chrome.action.onClicked is NOT used because we have a popup configured
// The popup (popup.html) handles the save action instead

// Track saves in progress to prevent duplicates
const savesInProgress = new Set<string>();

/**
 * Save the current tab to Vault
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
      console.log("Already saving this URL, skipping duplicate request");
      return;
    }
    
    // Mark this URL as being saved
    savesInProgress.add(saveKey);
    
    if (!tab.url || !tab.title) {
      showNotification("Error", "Could not get page information", "error");
      return;
    }

    // Don't save chrome:// or extension pages
    if (
      tab.url.startsWith("chrome://") ||
      tab.url.startsWith("chrome-extension://") ||
      tab.url.startsWith("about:")
    ) {
      showNotification(
        "Cannot Save",
        "Cannot save internal browser pages",
        "error"
      );
      return;
    }

    // Show loading notification
    const notificationId = showNotification(
      "Saving...",
      `Saving "${tab.title}"`,
      "info"
    );

    // Save to Vault
    const response = await saveLink({
      url: tab.url,
      title: tab.title,
      content_type: "url",
    });

    // Clear loading notification
    if (notificationId) {
      chrome.notifications.clear(notificationId);
    }

    if (response.success) {
      showNotification(
        "Saved to Vault!",
        `"${tab.title}" has been saved`,
        "success"
      );
    } else {
      showNotification(
        "Save Failed",
        response.error || "Unknown error occurred",
        "error"
      );
    }
  } catch (error) {
    console.error("Error saving tab:", error);
    showNotification(
      "Error",
      error instanceof Error ? error.message : "Failed to save",
      "error"
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
 * Show a notification to the user
 */
function showNotification(
  title: string,
  message: string,
  type: "info" | "success" | "error" = "info"
): string {
  const iconUrl = {
    info: "icons/icon-48.png",
    success: "icons/icon-48.png",
    error: "icons/icon-48.png",
  }[type];

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

// Listen for messages from popup/content scripts
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

console.log("Vault background service worker loaded");

