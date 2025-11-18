/**
 * Popup UI script
 */

import { saveLink } from "../lib/api-client";
import { getApiToken, getVaultUrl } from "../lib/storage";

// DOM elements
const pageTitle = document.getElementById("pageTitle") as HTMLDivElement;
const pageUrl = document.getElementById("pageUrl") as HTMLDivElement;
const saveBtn = document.getElementById("saveBtn") as HTMLButtonElement;
const saveBtnText = document.getElementById("saveBtnText") as HTMLSpanElement;
const settingsBtn = document.getElementById("settingsBtn") as HTMLButtonElement;
const openVaultBtn = document.getElementById("openVaultBtn") as HTMLButtonElement;
const statusMessage = document.getElementById("statusMessage") as HTMLDivElement;
const statusText = document.getElementById("statusText") as HTMLSpanElement;

let currentTab: chrome.tabs.Tab | null = null;

// Initialize popup
async function init() {
  // Get current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tab;

  // Check if token is configured first
  const token = await getApiToken();
  if (!token) {
    // Not connected - show connect message
    pageTitle.textContent = "Not Connected";
    pageUrl.textContent = "Connect your Vault account to start saving links";
    saveBtn.disabled = true;
    saveBtnText.textContent = "Open Settings";
    
    // Change save button to open settings
    saveBtn.onclick = () => {
      chrome.runtime.openOptionsPage();
    };
    saveBtn.disabled = false;
    
    showStatus("Click above to connect your account", "info");
    return;
  }

  if (!tab.url || !tab.title) {
    showStatus("Cannot save this page", "error");
    return;
  }

  // Check for invalid URLs
  if (
    tab.url.startsWith("chrome://") ||
    tab.url.startsWith("chrome-extension://") ||
    tab.url.startsWith("about:")
  ) {
    pageTitle.textContent = "Cannot save internal browser pages";
    pageUrl.textContent = tab.url;
    showStatus("Internal browser pages cannot be saved", "error");
    return;
  }

  // Display page info
  pageTitle.textContent = tab.title;
  pageUrl.textContent = tab.url;

  // Enable save button
  saveBtn.disabled = false;
}

// Save current page
async function savePage() {
  if (!currentTab?.url || !currentTab.title) {
    showStatus("No page to save", "error");
    return;
  }

  try {
    // Update button state
    saveBtn.disabled = true;
    saveBtn.classList.add("saving");
    saveBtnText.textContent = "Saving...";
    hideStatus();

    // Save to Vault
    const response = await saveLink({
      url: currentTab.url,
      title: currentTab.title,
      content_type: "url",
    });

    if (response.success) {
      saveBtn.classList.remove("saving");
      saveBtn.classList.add("success");
      saveBtnText.textContent = "Saved!";
      showStatus("Successfully saved to Vault", "success");

      // Reset after 2 seconds
      setTimeout(() => {
        saveBtn.classList.remove("success");
        saveBtnText.textContent = "Save to Vault";
        saveBtn.disabled = false;
      }, 2000);
    } else {
      saveBtn.classList.remove("saving");
      saveBtnText.textContent = "Save to Vault";
      saveBtn.disabled = false;
      showStatus(response.error || "Failed to save", "error");
    }
  } catch (error) {
    console.error("Error saving page:", error);
    saveBtn.classList.remove("saving");
    saveBtnText.textContent = "Save to Vault";
    saveBtn.disabled = false;
    showStatus(
      error instanceof Error ? error.message : "Failed to save",
      "error"
    );
  }
}

// Show status message
function showStatus(message: string, type: "success" | "error" | "info") {
  statusMessage.style.display = "flex";
  statusMessage.className = `status-message ${type}`;
  statusText.textContent = message;
}

// Hide status message
function hideStatus() {
  statusMessage.style.display = "none";
}

// Open settings
function openSettings() {
  chrome.runtime.openOptionsPage();
}

// Open Vault in new tab
async function openVault() {
  const vaultUrl = await getVaultUrl();
  chrome.tabs.create({ url: vaultUrl });
}

// Event listeners
saveBtn.addEventListener("click", savePage);
settingsBtn.addEventListener("click", openSettings);
openVaultBtn.addEventListener("click", openVault);

// Initialize on load
init();

