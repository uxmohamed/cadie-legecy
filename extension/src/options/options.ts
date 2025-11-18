/**
 * Options page script - One-Click Connect Flow
 */

import { testConnection } from "../lib/api-client";
import { getSettings, saveSettings, clearSettings } from "../lib/storage";

// DOM elements
const notConnectedView = document.getElementById("notConnectedView") as HTMLDivElement;
const connectedView = document.getElementById("connectedView") as HTMLDivElement;
const connectBtn = document.getElementById("connectBtn") as HTMLButtonElement;
const disconnectBtn = document.getElementById("disconnectBtn") as HTMLButtonElement;
const testConnectionBtn = document.getElementById("testConnectionBtn") as HTMLButtonElement;
const openVaultBtn = document.getElementById("openVaultBtn") as HTMLAnchorElement;
const statusMessage = document.getElementById("statusMessage") as HTMLDivElement;
const statusText = document.getElementById("statusText") as HTMLSpanElement;
const connectedEmail = document.getElementById("connectedEmail") as HTMLParagraphElement;
const connectedUrl = document.getElementById("connectedUrl") as HTMLParagraphElement;

// Manual config elements
const manualVaultUrl = document.getElementById("manualVaultUrl") as HTMLInputElement;
const manualApiToken = document.getElementById("manualApiToken") as HTMLInputElement;
const manualToggleTokenBtn = document.getElementById("manualToggleTokenBtn") as HTMLButtonElement;
const manualToggleTokenText = document.getElementById("manualToggleTokenText") as HTMLSpanElement;
const manualSaveBtn = document.getElementById("manualSaveBtn") as HTMLButtonElement;
const manualTestBtn = document.getElementById("manualTestBtn") as HTMLButtonElement;

// State
let currentSettings = {
  apiToken: "",
  vaultUrl: "https://vault-theta-lac.vercel.app", // Default to production
  userEmail: "",
};

// Initialize options page
async function init() {
  // Check if we just received authorization from URL params
  checkAuthorizationParams();

  // Load saved settings
  await loadSettings();

  // Update UI based on connection status
  updateView();

  // Update Open Vault link
  openVaultBtn.href = currentSettings.vaultUrl || "https://vault-theta-lac.vercel.app";
}

/**
 * Check if URL contains authorization parameters
 */
function checkAuthorizationParams() {
  const params = new URLSearchParams(window.location.search);
  const authorized = params.get("authorized");
  const token = params.get("token");
  const email = params.get("email");
  const url = params.get("url");

  if (authorized === "true" && token) {
    // Save settings
    saveSettings({
      apiToken: token,
      vaultUrl: url || "https://vault-theta-lac.vercel.app",
      userEmail: email || "",
    }).then(() => {
      // Clear URL params
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Reload to show connected state
      init();
      
      showStatus("Successfully connected to Vault!", "success");
    });
  }
}

/**
 * Load settings from storage
 */
async function loadSettings() {
  const settings = await getSettings();
  let vaultUrl = settings.vaultUrl || "https://vault-theta-lac.vercel.app";
  
  // If vaultUrl is localhost, replace with production URL
  if (vaultUrl === "http://localhost:3000" || vaultUrl.startsWith("http://localhost")) {
    vaultUrl = "https://vault-theta-lac.vercel.app";
    // Save the corrected URL
    await saveSettings({ vaultUrl });
  }
  
  currentSettings = {
    apiToken: settings.apiToken || "",
    vaultUrl: vaultUrl,
    userEmail: settings.userEmail || "",
  };

  // Update manual config fields
  if (manualVaultUrl) manualVaultUrl.value = currentSettings.vaultUrl;
}

/**
 * Update view based on connection status
 */
function updateView() {
  const isConnected = !!currentSettings.apiToken;

  if (isConnected) {
    // Show connected view
    notConnectedView.style.display = "none";
    connectedView.style.display = "block";

    // Update user info
    if (connectedEmail) {
      connectedEmail.textContent = currentSettings.userEmail || "Connected";
    }
    if (connectedUrl) {
      connectedUrl.textContent = currentSettings.vaultUrl;
    }
  } else {
    // Show not connected view
    notConnectedView.style.display = "block";
    connectedView.style.display = "none";
  }
}

/**
 * Handle one-click connect
 */
async function handleConnect() {
  try {
    connectBtn.classList.add("loading");
    connectBtn.disabled = true;

    // Get the extension ID
    const extensionId = chrome.runtime.id;

    // Determine vault URL - always default to production, never localhost
    let vaultUrl = currentSettings.vaultUrl;
    
    // If no URL set, or if it's localhost, use production
    if (!vaultUrl || vaultUrl === "http://localhost:3000" || vaultUrl.startsWith("http://localhost")) {
      vaultUrl = "https://vault-theta-lac.vercel.app";
    }
    
    // Try to detect if user is on a Vault page and use that URL (async)
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]?.url) {
      try {
        const tabUrl = new URL(tabs[0].url);
        // Check if this is a Vault domain (production)
        if (tabUrl.hostname.includes("vault") || tabUrl.hostname.includes("vercel.app")) {
          vaultUrl = `${tabUrl.protocol}//${tabUrl.host}`;
        }
      } catch (e) {
        // Invalid URL, use default
      }
    }
    
    const authUrl = `${vaultUrl}/extension/authorize?extensionId=${extensionId}`;
    console.log("Opening authorize URL:", authUrl);

    // Open authorization page in new tab
    const tab = await chrome.tabs.create({ url: authUrl });

    // Listen for authorization message (in case web app uses messaging)
    chrome.runtime.onMessage.addListener(handleAuthMessage);

    // Also poll the tab to see if it closes (user completed auth)
    let checkInterval: number | undefined;
    
    // Listen for messages from background script when auth completes
    const messageListener = (message: any) => {
      if (message.type === "VAULT_AUTH_COMPLETE") {
        chrome.runtime.onMessage.removeListener(messageListener);
        if (checkInterval) clearInterval(checkInterval);
        loadSettings().then(() => {
          updateView();
          connectBtn.classList.remove("loading");
          connectBtn.disabled = false;
        });
      }
    };
    chrome.runtime.onMessage.addListener(messageListener);

    checkInterval = setInterval(async () => {
      try {
        const updatedTab = await chrome.tabs.get(tab.id!);
        if (!updatedTab) {
          // Tab closed, check if we got authorized
          clearInterval(checkInterval);
          chrome.runtime.onMessage.removeListener(messageListener);
          await loadSettings();
          updateView();
          connectBtn.classList.remove("loading");
          connectBtn.disabled = false;
        }
      } catch {
        // Tab doesn't exist anymore
        clearInterval(checkInterval);
        chrome.runtime.onMessage.removeListener(messageListener);
        await loadSettings();
        updateView();
        connectBtn.classList.remove("loading");
        connectBtn.disabled = false;
      }
    }, 1000);

    // Timeout after 5 minutes
    setTimeout(() => {
      clearInterval(checkInterval);
      connectBtn.classList.remove("loading");
      connectBtn.disabled = false;
    }, 300000);

  } catch (error) {
    console.error("Error connecting:", error);
    showStatus("Failed to open authorization page", "error");
    connectBtn.classList.remove("loading");
    connectBtn.disabled = false;
  }
}

/**
 * Handle authorization message from web app
 */
function handleAuthMessage(message: any, sender: any, sendResponse: any) {
  if (message.type === "VAULT_AUTH") {
    // Save authorization data
    saveSettings({
      apiToken: message.token,
      vaultUrl: message.vaultUrl,
      userEmail: message.email,
    }).then(async () => {
      await loadSettings();
      updateView();
      showStatus("Successfully connected!", "success");
      connectBtn.classList.remove("loading");
      connectBtn.disabled = false;
      sendResponse({ success: true });
    });
    return true; // Keep message channel open
  }
  
  if (message.type === "VAULT_AUTH_COMPLETE") {
    // Background script notified us that auth completed
    loadSettings().then(() => {
      updateView();
      connectBtn.classList.remove("loading");
      connectBtn.disabled = false;
      showStatus("Successfully connected to Vault!", "success");
    });
    sendResponse({ success: true });
    return true;
  }
}

/**
 * Handle disconnect
 */
async function handleDisconnect() {
  if (!confirm("Are you sure you want to disconnect? You'll need to reconnect to save links.")) {
    return;
  }

  try {
    disconnectBtn.disabled = true;

    // Clear settings
    await clearSettings();
    currentSettings = {
      apiToken: "",
      vaultUrl: "https://vault-theta-lac.vercel.app",
      userEmail: "",
    };

    // Update view
    updateView();
    showStatus("Disconnected from Vault", "info");
  } catch (error) {
    console.error("Error disconnecting:", error);
    showStatus("Failed to disconnect", "error");
  } finally {
    disconnectBtn.disabled = false;
  }
}

/**
 * Test connection
 */
async function handleTestConnection() {
  try {
    testConnectionBtn.disabled = true;
    testConnectionBtn.classList.add("loading");

    const response = await testConnection();

    if (response.success) {
      showStatus("Connection successful! Extension is ready to use.", "success");
    } else {
      showStatus(response.error || "Connection failed", "error");
    }
  } catch (error) {
    console.error("Error testing connection:", error);
    showStatus("Connection test failed", "error");
  } finally {
    testConnectionBtn.disabled = false;
    testConnectionBtn.classList.remove("loading");
  }
}

/**
 * Handle manual save (advanced config)
 */
async function handleManualSave() {
  const vaultUrl = manualVaultUrl.value.trim();
  const apiToken = manualApiToken.value.trim();

  if (!vaultUrl) {
    showStatus("Please enter a Vault URL", "error");
    return;
  }

  if (!apiToken) {
    showStatus("Please enter an API token", "error");
    return;
  }

  // Validate URL
  try {
    new URL(vaultUrl);
  } catch {
    showStatus("Please enter a valid URL", "error");
    return;
  }

  try {
    manualSaveBtn.disabled = true;
    manualSaveBtn.classList.add("loading");

    await saveSettings({ vaultUrl, apiToken });
    await loadSettings();
    updateView();

    showStatus("Settings saved successfully!", "success");
  } catch (error) {
    console.error("Error saving settings:", error);
    showStatus("Failed to save settings", "error");
  } finally {
    manualSaveBtn.disabled = false;
    manualSaveBtn.classList.remove("loading");
  }
}

/**
 * Handle manual test (advanced config)
 */
async function handleManualTest() {
  try {
    manualTestBtn.disabled = true;
    manualTestBtn.classList.add("loading");

    const response = await testConnection();

    if (response.success) {
      showStatus("Connection successful!", "success");
    } else {
      showStatus(response.error || "Connection failed", "error");
    }
  } catch (error) {
    console.error("Error testing connection:", error);
    showStatus("Connection test failed", "error");
  } finally {
    manualTestBtn.disabled = false;
    manualTestBtn.classList.remove("loading");
  }
}

/**
 * Toggle manual token visibility
 */
function toggleManualTokenVisibility() {
  if (manualApiToken.type === "password") {
    manualApiToken.type = "text";
    manualToggleTokenText.textContent = "Hide";
  } else {
    manualApiToken.type = "password";
    manualToggleTokenText.textContent = "Show";
  }
}

/**
 * Show status message
 */
function showStatus(message: string, type: "success" | "error" | "info") {
  statusMessage.style.display = "flex";
  statusMessage.className = `status-message ${type}`;
  statusText.textContent = message;

  // Auto-hide after 5 seconds
  setTimeout(() => {
    statusMessage.style.display = "none";
  }, 5000);
}

// Event listeners
connectBtn?.addEventListener("click", handleConnect);
disconnectBtn?.addEventListener("click", handleDisconnect);
testConnectionBtn?.addEventListener("click", handleTestConnection);
manualSaveBtn?.addEventListener("click", handleManualSave);
manualTestBtn?.addEventListener("click", handleManualTest);
manualToggleTokenBtn?.addEventListener("click", toggleManualTokenVisibility);

// Save on Enter key in manual inputs
manualVaultUrl?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleManualSave();
});

manualApiToken?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleManualSave();
});

// Initialize on load
init();
