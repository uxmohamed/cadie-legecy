/**
 * Content script - runs on web pages
 * Features:
 * - Show save overlay (toast notification)
 * - Handle authorization flow for extension connection
 */

// Track overlay element
let overlayElement: HTMLElement | null = null;
let hideTimeout: number | null = null;

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "showSaveOverlay") {
    const { state, message } = request;
    if (state === "loading") {
      showOverlay("Saving to Cadie...", "loading", false);
    } else if (state === "success") {
      showOverlay("Saved to Cadie", "success", true);
      hideTimeout = window.setTimeout(() => hideOverlay(), 2500);
    } else if (state === "duplicate") {
      showOverlay("Already in Cadie!", "duplicate", true);
      hideTimeout = window.setTimeout(() => hideOverlay(), 2500);
    } else if (state === "error") {
      showOverlay(message || "Failed to save", "error", true);
      hideTimeout = window.setTimeout(() => hideOverlay(), 3000);
    } else if (state === "auth-required") {
      showAuthPromptOverlay();
    }
    sendResponse({ success: true });
  }

  return true; // Keep message channel open for async response
});


/**
 * Show the save overlay
 * @param text - Text to display
 * @param state - Visual state of the overlay
 * @param withProgress - Whether to show progress fill animation
 */
function showOverlay(text: string, state: "loading" | "success" | "error" | "duplicate", withProgress: boolean = false) {
  // Clear any existing hide timeout
  if (hideTimeout) {
    clearTimeout(hideTimeout);
    hideTimeout = null;
  }

  // If overlay already exists, animate the content transition
  if (overlayElement && document.body.contains(overlayElement)) {
    const content = overlayElement.querySelector(".cadie-overlay-content");
    const inner = overlayElement.querySelector(".cadie-overlay-inner");
    const icon = overlayElement.querySelector(".cadie-overlay-icon");
    const textEl = overlayElement.querySelector(".cadie-overlay-text");

    if (content && inner && icon && textEl) {
      // Fade out, update, fade in
      inner.classList.add("cadie-fading");
      inner.classList.remove("cadie-fade-in");

      setTimeout(() => {
        // Update icon state and content
        icon.setAttribute("data-state", state);
        icon.innerHTML = getIconHTML(state);

        // Update text
        textEl.textContent = text;

        // Update progress class
        if (withProgress) {
          content.classList.add("cadie-with-progress");
        } else {
          content.classList.remove("cadie-with-progress");
        }

        // Fade back in
        inner.classList.remove("cadie-fading");
        inner.classList.add("cadie-fade-in");
      }, 90); // Match the fade-out duration

      return;
    }
  }

  // Create new overlay
  overlayElement = document.createElement("div");
  overlayElement.id = "cadie-save-overlay";

  const content = document.createElement("div");
  content.className = "cadie-overlay-content" + (withProgress ? " cadie-with-progress" : "");

  // Inner wrapper for fade transitions
  const inner = document.createElement("div");
  inner.className = "cadie-overlay-inner";

  // Icon with data-state for CSS styling
  const icon = document.createElement("div");
  icon.className = "cadie-overlay-icon";
  icon.setAttribute("data-state", state);
  icon.innerHTML = getIconHTML(state);

  // Text
  const textEl = document.createElement("div");
  textEl.className = "cadie-overlay-text";
  textEl.textContent = text;

  inner.appendChild(icon);
  inner.appendChild(textEl);
  content.appendChild(inner);
  overlayElement.appendChild(content);

  try {
    if (document.body) {
      document.body.appendChild(overlayElement);
    } else {
      document.documentElement.appendChild(overlayElement);
    }
  } catch (error) {
    console.error("Failed to add overlay to DOM:", error);
  }
}

/**
 * Get icon HTML based on state
 */
function getIconHTML(state: "loading" | "success" | "error" | "duplicate"): string {
  if (state === "loading") {
    return `<div class="cadie-spinner"></div>`;
  } else if (state === "success") {
    return `
      <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    `;
  } else if (state === "duplicate") {
    return `
      <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
      </svg>
    `;
  } else {
    return `
      <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
      </svg>
    `;
  }
}

/**
 * Hide the overlay
 */
function hideOverlay() {
  if (overlayElement) {
    overlayElement.classList.add("cadie-hiding");
    setTimeout(() => {
      if (overlayElement) {
        overlayElement.remove();
        overlayElement = null;
      }
    }, 200);
  }
}

/**
 * Show auth prompt overlay with connect button
 */
function showAuthPromptOverlay() {
  // Clear any existing hide timeout
  if (hideTimeout) {
    clearTimeout(hideTimeout);
    hideTimeout = null;
  }

  // Remove existing overlay if present
  if (overlayElement) {
    overlayElement.remove();
    overlayElement = null;
  }

  // Create new auth prompt overlay
  overlayElement = document.createElement("div");
  overlayElement.id = "cadie-save-overlay";
  overlayElement.className = "cadie-auth-prompt";

  const content = document.createElement("div");
  content.className = "cadie-overlay-content cadie-auth-content";

  // Icon
  const icon = document.createElement("div");
  icon.className = "cadie-overlay-icon";
  icon.setAttribute("data-state", "auth");
  icon.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
      <polyline points="10 17 15 12 10 7"/>
      <line x1="15" y1="12" x2="3" y2="12"/>
    </svg>
  `;

  // Text
  const textEl = document.createElement("div");
  textEl.className = "cadie-overlay-text";
  textEl.textContent = "Connect to Cadie";

  // Connect button
  const connectBtn = document.createElement("button");
  connectBtn.className = "cadie-connect-btn";
  connectBtn.textContent = "Connect";
  connectBtn.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "openAuthPage" });
    hideOverlay();
  });

  // Close button
  const closeBtn = document.createElement("button");
  closeBtn.className = "cadie-close-btn";
  closeBtn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  `;
  closeBtn.addEventListener("click", () => hideOverlay());

  content.appendChild(icon);
  content.appendChild(textEl);
  content.appendChild(connectBtn);
  content.appendChild(closeBtn);
  overlayElement.appendChild(content);

  try {
    if (document.body) {
      document.body.appendChild(overlayElement);
    } else {
      document.documentElement.appendChild(overlayElement);
    }
  } catch (error) {
    console.error("Failed to add auth prompt overlay to DOM:", error);
  }
}

// Track if we've already processed auth to prevent duplicates
let authProcessed = false;

// Allowed origins for receiving auth messages
const ALLOWED_AUTH_ORIGINS = [
  "https://cadie.app",
  "https://www.cadie.app",
];

// Listen for authorization success via postMessage (works across isolated worlds)
// SECURITY: Strict origin validation to prevent token theft
window.addEventListener("message", (event: MessageEvent) => {
  // Only accept messages from the same window
  if (event.source !== window) return;
  
  // SECURITY: Validate origin strictly - only accept from cadie.app
  if (!ALLOWED_AUTH_ORIGINS.includes(event.origin)) return;
  
  // Only process auth messages on cadie.app domain
  if (!window.location.hostname.includes("cadie.app")) return;
  
  const data = event.data;
  if (data?.type === "CADIE_AUTH_SUCCESS" && data?.token && !authProcessed) {
    authProcessed = true;
    console.log("[Cadie] Content script received token, length:", data.token?.length || 0);
    // Send auth data to background script
    chrome.runtime.sendMessage({
      type: "CADIE_AUTH_SUCCESS",
      data: {
        token: data.token,
        email: data.email,
        url: "https://cadie.app",
        cadieUrl: "https://cadie.app",
        state: data.state,
      },
    }, (response) => {
      console.log("[Cadie] Background response:", response);
      if (chrome.runtime.lastError) {
        console.error("Error sending auth message:", chrome.runtime.lastError);
        authProcessed = false; // Allow retry on error
      } else {
        // Send acknowledgment back to page via postMessage
        window.postMessage({ type: "CADIE_AUTH_ACK", success: true }, "*");
      }
    });
  }
});

// Also check for auth data in DOM (fallback and polling)
// Only runs on cadie.app authorize page
if (window.location.hostname.includes("cadie.app") && window.location.pathname.includes("/extension/authorize")) {
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
  if (authProcessed) return true; // Already processed
  
  const authDataElement = document.getElementById("cadie-auth-data");
  if (authDataElement) {
    try {
      const authData = JSON.parse(authDataElement.getAttribute("data-auth") || "{}");
      if (authData.token) {
        authProcessed = true;
        chrome.runtime.sendMessage({
          type: "CADIE_AUTH_SUCCESS",
          data: {
            token: authData.token,
            email: authData.email,
            url: "https://cadie.app", // Always use production
            cadieUrl: "https://cadie.app",
            state: authData.state,
          },
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.error("Error sending auth message:", chrome.runtime.lastError);
            authProcessed = false; // Allow retry on error
          } else {
            // Send acknowledgment back to page via postMessage
            window.postMessage({ type: "CADIE_AUTH_ACK", success: true }, "*");
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
