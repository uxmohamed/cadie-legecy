/**
 * Content script - runs on web pages
 * Features:
 * - Show save overlay with loading and success states
 * - Capture selected text
 */

// Track overlay element
let overlayElement: HTMLElement | null = null;
let hideTimeout: number | null = null;

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getSelectedText") {
    const selectedText = window.getSelection()?.toString() || "";
    sendResponse({ selectedText });
  }

  if (request.action === "getPageMetadata") {
    const metadata = extractPageMetadata();
    sendResponse(metadata);
  }

  if (request.action === "showSaveOverlay") {
    const { state, message } = request;
    if (state === "loading") {
      showOverlay("Saving to Cadie...", "loading");
    } else if (state === "success") {
      showOverlay("Saved to Cadie ✨", "success");
      // Auto-hide after 2.5 seconds
      hideTimeout = window.setTimeout(() => {
        hideOverlay();
      }, 2500);
    } else if (state === "duplicate") {
      showOverlay("Already in Cadie!", "duplicate");
      // Auto-hide after 2.5 seconds
      hideTimeout = window.setTimeout(() => {
        hideOverlay();
      }, 2500);
    } else if (state === "error") {
      showOverlay(message || "Failed to save", "error");
      // Auto-hide after 3 seconds
      hideTimeout = window.setTimeout(() => {
        hideOverlay();
      }, 3000);
    }
    sendResponse({ success: true });
  }

  return true; // Keep message channel open for async response
});

/**
 * Extract page metadata (favicon, og:image, description)
 */
function extractPageMetadata(): {
  favicon_url?: string;
  og_image_url?: string;
  description?: string;
} {
  const metadata: {
    favicon_url?: string;
    og_image_url?: string;
    description?: string;
  } = {};

  // Get favicon - try multiple sources
  const iconLink = document.querySelector<HTMLLinkElement>(
    'link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]'
  );
  if (iconLink?.href) {
    metadata.favicon_url = iconLink.href;
  } else {
    // Fallback to /favicon.ico
    try {
      const url = new URL(window.location.href);
      metadata.favicon_url = `${url.origin}/favicon.ico`;
    } catch (e) {
      // Ignore
    }
  }

  // Get OG image
  const ogImage = document.querySelector<HTMLMetaElement>(
    'meta[property="og:image"], meta[name="og:image"]'
  );
  if (ogImage?.content) {
    metadata.og_image_url = ogImage.content;
  } else {
    // Try Twitter image
    const twitterImage = document.querySelector<HTMLMetaElement>(
      'meta[name="twitter:image"], meta[property="twitter:image"]'
    );
    if (twitterImage?.content) {
      metadata.og_image_url = twitterImage.content;
    }
  }

  // Get description - try OG first, then meta description
  const ogDescription = document.querySelector<HTMLMetaElement>(
    'meta[property="og:description"], meta[name="og:description"]'
  );
  if (ogDescription?.content) {
    metadata.description = ogDescription.content;
  } else {
    const metaDescription = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]'
    );
    if (metaDescription?.content) {
      metadata.description = metaDescription.content;
    }
  }

  return metadata;
}

/**
 * Show the save overlay
 */
function showOverlay(text: string, state: "loading" | "success" | "error" | "duplicate") {
  // Clear any existing hide timeout
  if (hideTimeout) {
    clearTimeout(hideTimeout);
    hideTimeout = null;
  }

  // If overlay already exists, just update the content (don't re-render)
  if (overlayElement && document.body.contains(overlayElement)) {
    const icon = overlayElement.querySelector(".cadie-overlay-icon");
    const textEl = overlayElement.querySelector(".cadie-overlay-text");
    
    if (icon && textEl) {
      // Update icon state and content
      icon.setAttribute("data-state", state);
      icon.innerHTML = getIconHTML(state);
      
      // Update text
      textEl.textContent = text;
      return;
    }
  }

  // Create new overlay
  overlayElement = document.createElement("div");
  overlayElement.id = "cadie-save-overlay";

  const content = document.createElement("div");
  content.className = "cadie-overlay-content";

  // Icon with data-state for CSS styling
  const icon = document.createElement("div");
  icon.className = "cadie-overlay-icon";
  icon.setAttribute("data-state", state);
  icon.innerHTML = getIconHTML(state);

  // Text
  const textEl = document.createElement("div");
  textEl.className = "cadie-overlay-text";
  textEl.textContent = text;

  content.appendChild(icon);
  content.appendChild(textEl);
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

// Listen for authorization success events
window.addEventListener("cadieAuthSuccess", (event: any) => {
  const detail = event.detail;
  if (detail && detail.token) {
    // Send auth data to background script
    chrome.runtime.sendMessage({
      type: "CADIE_AUTH_SUCCESS",
      data: {
        token: detail.token,
        email: detail.email,
        url: detail.url || detail.cadieUrl,
        cadieUrl: detail.url || detail.cadieUrl,
        state: detail.state,
      },
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error sending auth message:", chrome.runtime.lastError);
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
  const authDataElement = document.getElementById("cadie-auth-data");
  if (authDataElement) {
    try {
      const authData = JSON.parse(authDataElement.getAttribute("data-auth") || "{}");
      if (authData.token) {
        chrome.runtime.sendMessage({
          type: "CADIE_AUTH_SUCCESS",
          data: {
            token: authData.token,
            email: authData.email,
            url: authData.url,
            cadieUrl: authData.url,
            state: authData.state,
          },
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.error("Error sending auth message:", chrome.runtime.lastError);
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
