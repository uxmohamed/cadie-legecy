/**
 * Options page - Simple connect/disconnect flow
 */

import { getSettings, getCadieUrl, clearSettings } from "../lib/storage";

// DOM elements
const notConnectedView = document.getElementById("notConnectedView") as HTMLDivElement;
const connectedView = document.getElementById("connectedView") as HTMLDivElement;
const connectBtn = document.getElementById("connectBtn") as HTMLButtonElement;
const disconnectBtn = document.getElementById("disconnectBtn") as HTMLButtonElement;
const statusMessage = document.getElementById("statusMessage") as HTMLDivElement;
const statusText = document.getElementById("statusText") as HTMLSpanElement;

// State
let isConnected = false;

// Initialize
async function init() {
  const settings = await getSettings();
  // Token must exist and be at least 32 characters to be valid
  isConnected = !!settings.apiToken && settings.apiToken.length >= 32;
  updateView();
}

// Update view based on connection status
function updateView() {
  if (isConnected) {
    notConnectedView.style.display = "none";
    connectedView.style.display = "block";
  } else {
    notConnectedView.style.display = "block";
    connectedView.style.display = "none";
  }
}

// Handle connect - opens Cadie authorization page
async function handleConnect() {
  try {
    connectBtn.classList.add("loading");
    connectBtn.disabled = true;

    const extensionId = chrome.runtime.id;
    const cadieUrl = await getCadieUrl();
    const authUrl = `${cadieUrl}/extension/authorize?extensionId=${extensionId}`;

    // Open authorization page
    await chrome.tabs.create({ url: authUrl });

    // Listen for auth completion
    const messageListener = (message: { type: string }) => {
      if (message.type === "CADIE_AUTH_COMPLETE") {
        chrome.runtime.onMessage.removeListener(messageListener);
        isConnected = true;
        updateView();
        connectBtn.classList.remove("loading");
        connectBtn.disabled = false;
        showStatus("Connected to Cadie!", "success");
      }
    };
    chrome.runtime.onMessage.addListener(messageListener);

  } catch (error) {
    showStatus("Failed to connect", "error");
    connectBtn.classList.remove("loading");
    connectBtn.disabled = false;
  }
}

// Handle disconnect
async function handleDisconnect() {
  if (!confirm("Disconnect from Cadie?")) return;

  try {
    disconnectBtn.disabled = true;
    await clearSettings();
    isConnected = false;
    updateView();
    showStatus("Disconnected", "info");
  } catch (error) {
    showStatus("Failed to disconnect", "error");
  } finally {
    disconnectBtn.disabled = false;
  }
}

// Show status message
function showStatus(message: string, type: "success" | "error" | "info") {
  statusMessage.style.display = "flex";
  statusMessage.className = `status-message ${type}`;
  statusText.textContent = message;
  setTimeout(() => { statusMessage.style.display = "none"; }, 4000);
}

// Event listeners
connectBtn?.addEventListener("click", handleConnect);
disconnectBtn?.addEventListener("click", handleDisconnect);

// Initialize
init();
