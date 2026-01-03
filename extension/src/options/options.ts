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
const openCadieBtn = document.getElementById("openCadieBtn") as HTMLAnchorElement;
const statusMessage = document.getElementById("statusMessage") as HTMLDivElement;
const statusText = document.getElementById("statusText") as HTMLSpanElement;
const connectedEmail = document.getElementById("connectedEmail") as HTMLParagraphElement;
const connectedUrl = document.getElementById("connectedUrl") as HTMLParagraphElement;

// Manual config elements
const manualCadieUrl = document.getElementById("manualCadieUrl") as HTMLInputElement;
const manualApiToken = document.getElementById("manualApiToken") as HTMLInputElement;
const manualToggleTokenBtn = document.getElementById("manualToggleTokenBtn") as HTMLButtonElement;
const manualToggleTokenText = document.getElementById("manualToggleTokenText") as HTMLSpanElement;
const manualSaveBtn = document.getElementById("manualSaveBtn") as HTMLButtonElement;
const manualTestBtn = document.getElementById("manualTestBtn") as HTMLButtonElement;

// State
let currentSettings = {
  apiToken: "",
  cadieUrl: "https://cadie.app", // Default to production
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

  // Update Open Cadie link
  openCadieBtn.href = currentSettings.cadieUrl || "https://cadie.app";
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
      cadieUrl: url || "https://cadie.app",
      userEmail: email || "",
    }).then(() => {
      // Clear URL params
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Reload to show connected state
      init();
      
      showStatus("Successfully connected to Cadie!", "success");
    });
  }
}

/**
 * Load settings from storage
 */
async function loadSettings() {
  const settings = await getSettings();
  const cadieUrl = settings.cadieUrl || "https://cadie.app";
  
  currentSettings = {
    apiToken: settings.apiToken || "",
    cadieUrl: cadieUrl,
    userEmail: settings.userEmail || "",
  };

  // Update manual config fields
  if (manualCadieUrl) manualCadieUrl.value = currentSettings.cadieUrl;
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
      connectedUrl.textContent = currentSettings.cadieUrl;
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

    // Always use production URL for one-click connect
    // Developers can use the Advanced Configuration section for localhost testing
    const cadieUrl = "https://cadie.app";
    
    const authUrl = `${cadieUrl}/extension/authorize?extensionId=${extensionId}`;

    // Open authorization page in new tab
    await chrome.tabs.create({ url: authUrl });

    // Listen for auth completion message from background script
    const messageListener = (message: any) => {
      if (message.type === "CADIE_AUTH_COMPLETE") {
        chrome.runtime.onMessage.removeListener(messageListener);
        loadSettings().then(() => {
          updateView();
          connectBtn.classList.remove("loading");
          connectBtn.disabled = false;
          showStatus("Successfully connected to Cadie!", "success");
        });
      }
    };
    chrome.runtime.onMessage.addListener(messageListener);

  } catch (error) {
    showStatus("Failed to open authorization page", "error");
    connectBtn.classList.remove("loading");
    connectBtn.disabled = false;
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
      cadieUrl: "https://cadie.app",
      userEmail: "",
    };

    // Update view
    updateView();
    showStatus("Disconnected from Cadie", "info");
  } catch (error) {
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
  const cadieUrl = manualCadieUrl.value.trim();
  const apiToken = manualApiToken.value.trim();

  if (!cadieUrl) {
    showStatus("Please enter a Cadie URL", "error");
    return;
  }

  if (!apiToken) {
    showStatus("Please enter an API token", "error");
    return;
  }

  // Validate URL
  try {
    new URL(cadieUrl);
  } catch {
    showStatus("Please enter a valid URL", "error");
    return;
  }

  try {
    manualSaveBtn.disabled = true;
    manualSaveBtn.classList.add("loading");

    await saveSettings({ cadieUrl, apiToken });
    await loadSettings();
    updateView();

    showStatus("Settings saved successfully!", "success");
  } catch (error) {
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
manualCadieUrl?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleManualSave();
});

manualApiToken?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleManualSave();
});

// Initialize on load
init();
