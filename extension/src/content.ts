/**
 * Content script - runs on web pages
 * Future features:
 * - Capture selected text
 * - Detect images under cursor
 * - Extract code snippets
 */

console.log("Vault extension content script loaded");

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getSelectedText") {
    const selectedText = window.getSelection()?.toString() || "";
    sendResponse({ selectedText });
  }
  
  return true; // Keep message channel open for async response
});

// Listen for authorization success events
window.addEventListener("vaultAuthSuccess", (event: any) => {
  const detail = event.detail;
  if (detail && detail.extensionId) {
    // Send auth data to background script
    chrome.runtime.sendMessage({
      type: "VAULT_AUTH_SUCCESS",
      data: {
        token: detail.token,
        email: detail.email,
        url: detail.url || detail.vaultUrl,
        state: detail.state,
      },
    });
  }
});

// Also check for auth data in DOM (fallback and polling)
if (window.location.pathname.includes("/extension/authorize")) {
  // Check immediately
  checkForAuthData();
  
  // Also poll in case content script loads after the event
  const pollInterval = setInterval(() => {
    if (checkForAuthData()) {
      clearInterval(pollInterval);
    }
  }, 500);
  
  // Stop polling after 10 seconds
  setTimeout(() => clearInterval(pollInterval), 10000);
}

function checkForAuthData(): boolean {
  const authDataElement = document.getElementById("vault-auth-data");
  if (authDataElement) {
    try {
      const authData = JSON.parse(authDataElement.getAttribute("data-auth") || "{}");
      if (authData.token) {
        chrome.runtime.sendMessage({
          type: "VAULT_AUTH_SUCCESS",
          data: authData,
        });
        return true;
      }
    } catch (e) {
      console.error("Error parsing auth data:", e);
    }
  }
  return false;
}

// Future: Add selection handlers, image detection, etc.

