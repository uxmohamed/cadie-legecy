/**
 * Content script - runs on web pages
 * Features:
 * - Show save overlay with loading and success states
 * - Capture selected text
 */

console.log("🚀 Caddy extension content script loaded on:", window.location.href);

// Track overlay element
let overlayElement: HTMLElement | null = null;
let hideTimeout: number | null = null;

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("📬 Content script received message:", request);
  
  if (request.action === "getSelectedText") {
    const selectedText = window.getSelection()?.toString() || "";
    console.log("📝 Selected text requested:", selectedText);
    sendResponse({ selectedText });
  }
  
  if (request.action === "showSaveOverlay") {
    console.log("🎨 showSaveOverlay triggered with state:", request.state);
    const { state, message } = request;
    if (state === "loading") {
      console.log("⏳ Showing loading overlay");
      showOverlay("Saving to Caddy...", "loading");
    } else if (state === "success") {
      console.log("✅ Showing success overlay");
      showOverlay("Saved to Caddy ✨", "success");
      // Auto-hide after 2.5 seconds
      hideTimeout = window.setTimeout(() => {
        console.log("⏱️ Auto-hiding success overlay");
        hideOverlay();
      }, 2500);
    } else if (state === "duplicate") {
      console.log("🔄 Showing duplicate overlay");
      showOverlay("Already in Caddy!", "duplicate");
      // Auto-hide after 2.5 seconds
      hideTimeout = window.setTimeout(() => {
        console.log("⏱️ Auto-hiding duplicate overlay");
        hideOverlay();
      }, 2500);
    } else if (state === "error") {
      console.error("❌ Showing error overlay:", message);
      showOverlay(message || "Failed to save", "error");
      // Auto-hide after 3 seconds
      hideTimeout = window.setTimeout(() => {
        console.log("⏱️ Auto-hiding error overlay");
        hideOverlay();
      }, 3000);
    }
    sendResponse({ success: true });
  }
  
  return true; // Keep message channel open for async response
});

/**
 * Show the save overlay
 */
function showOverlay(text: string, state: "loading" | "success" | "error" | "duplicate") {
  console.log("🖼️ showOverlay function called:", text, state);
  
  // Clear any existing hide timeout
  if (hideTimeout) {
    clearTimeout(hideTimeout);
    hideTimeout = null;
  }

  // Remove existing overlay if present
  if (overlayElement) {
    console.log("🗑️ Removing existing overlay");
    overlayElement.remove();
  }

  // Create overlay
  overlayElement = document.createElement("div");
  overlayElement.id = "caddy-save-overlay";
  
  const content = document.createElement("div");
  content.className = "caddy-overlay-content";
  
  // Icon
  const icon = document.createElement("div");
  icon.className = "caddy-overlay-icon";
  
  if (state === "loading") {
    const spinner = document.createElement("div");
    spinner.className = "caddy-spinner";
    icon.appendChild(spinner);
    icon.style.background = "#f3f4f6";
  } else if (state === "success") {
    icon.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    `;
    icon.style.background = "#dcfce7";
  } else if (state === "duplicate") {
    icon.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
      </svg>
    `;
    icon.style.background = "#fef3c7";
  } else if (state === "error") {
    icon.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
      </svg>
    `;
    icon.style.background = "#fee2e2";
  }
  
  // Text
  const textEl = document.createElement("div");
  textEl.className = "caddy-overlay-text";
  textEl.textContent = text;
  
  content.appendChild(icon);
  content.appendChild(textEl);
  overlayElement.appendChild(content);
  
  console.log("✨ Appending overlay to document.body");
  try {
    // Try appending to body first
    if (document.body) {
      document.body.appendChild(overlayElement);
      console.log("✅ Overlay successfully added to body");
    } else {
      // Fallback to documentElement if body doesn't exist
      document.documentElement.appendChild(overlayElement);
      console.log("✅ Overlay successfully added to documentElement");
    }
  } catch (error) {
    console.error("❌ Failed to add overlay to DOM:", error);
  }
}

/**
 * Hide the overlay
 */
function hideOverlay() {
  if (overlayElement) {
    overlayElement.classList.add("caddy-hiding");
    setTimeout(() => {
      if (overlayElement) {
        overlayElement.remove();
        overlayElement = null;
      }
    }, 200);
  }
}

// Listen for authorization success events
window.addEventListener("caddyAuthSuccess", (event: any) => {
  const detail = event.detail;
  if (detail && detail.token) {
    console.log("Caddy auth success event received", detail);
    // Send auth data to background script
    chrome.runtime.sendMessage({
      type: "CADDY_AUTH_SUCCESS",
      data: {
        token: detail.token,
        email: detail.email,
        url: detail.url || detail.caddyUrl,
        caddyUrl: detail.url || detail.caddyUrl,
        state: detail.state,
      },
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error sending auth message:", chrome.runtime.lastError);
      } else {
        console.log("Auth message sent successfully", response);
      }
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
  const authDataElement = document.getElementById("caddy-auth-data");
  if (authDataElement) {
    try {
      const authData = JSON.parse(authDataElement.getAttribute("data-auth") || "{}");
      if (authData.token) {
        console.log("Found auth data in DOM, sending to background", authData);
        chrome.runtime.sendMessage({
          type: "CADDY_AUTH_SUCCESS",
          data: {
            token: authData.token,
            email: authData.email,
            url: authData.url,
            caddyUrl: authData.url,
            state: authData.state,
          },
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.error("Error sending auth message:", chrome.runtime.lastError);
          } else {
            console.log("Auth message sent successfully", response);
          }
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

