/**
 * Content script - runs on web pages
 * Features:
 * - Show save overlay (toast notification)
 * - Add to space functionality
 * - Handle authorization flow for extension connection
 */

import type { Space, SpacesResponse } from "./lib/api-client";

// ============================================================================
// Tabler Icons (inline SVGs)
// ============================================================================

const TABLER_ICONS = {
  // IconLoader2 - spinner (loading state)
  loader: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 3a9 9 0 1 0 9 9"/>
  </svg>`,

  // IconCircleCheckFilled - success (green checkmark)
  circleCheckFilled: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17 3.34a10 10 0 1 1 -14.995 8.984l-.005 -.324l.005 -.324a10 10 0 0 1 14.995 -8.336zm-1.293 5.953a1 1 0 0 0 -1.32 -.083l-.094 .083l-3.293 3.292l-1.293 -1.292l-.094 -.083a1 1 0 0 0 -1.403 1.403l.083 .094l2 2l.094 .083a1 1 0 0 0 1.226 0l.094 -.083l4 -4l.083 -.094a1 1 0 0 0 -.083 -1.32z"/>
  </svg>`,

  // IconAlertTriangleFilled - duplicate/warning (yellow triangle)
  alertTriangleFilled: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 1.67c.955 0 1.845 .467 2.39 1.247l.105 .16l8.114 13.548a2.914 2.914 0 0 1 -2.307 4.363l-.195 .008h-16.225a2.914 2.914 0 0 1 -2.582 -4.2l.099 -.185l8.11 -13.538a2.914 2.914 0 0 1 2.491 -1.403zm.01 13.33l-.127 .007a1 1 0 0 0 0 1.986l.117 .007l.127 -.007a1 1 0 0 0 0 -1.986l-.117 -.007zm-.01 -7a1 1 0 0 0 -.993 .883l-.007 .117v4l.007 .117a1 1 0 0 0 1.986 0l.007 -.117v-4l-.007 -.117a1 1 0 0 0 -.993 -.883z"/>
  </svg>`,

  // IconCircleXFilled - error (red X)
  circleXFilled: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17 3.34a10 10 0 1 1 -14.995 8.984l-.005 -.324l.005 -.324a10 10 0 0 1 14.995 -8.336zm-6.489 5.8a1 1 0 0 0 -1.218 1.567l1.292 1.293l-1.292 1.293l-.083 .094a1 1 0 0 0 1.497 1.32l1.293 -1.292l1.293 1.292l.094 .083a1 1 0 0 0 1.32 -1.497l-1.292 -1.293l1.292 -1.293l.083 -.094a1 1 0 0 0 -1.497 -1.32l-1.293 1.292l-1.293 -1.292l-.094 -.083z"/>
  </svg>`,

  // IconChevronDown
  chevronDown: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M6 9l6 6l6 -6"/>
  </svg>`,

  // IconLogin - auth/connect
  login: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M15 8v-2a2 2 0 0 0 -2 -2h-7a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2 -2v-2"/>
    <path d="M21 12h-13l3 -3"/>
    <path d="M11 15l-3 -3"/>
  </svg>`,

  // IconX - close
  x: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M18 6l-12 12"/>
    <path d="M6 6l12 12"/>
  </svg>`,

  // IconCheck - checkmark for selected items
  check: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M5 12l5 5l10 -10"/>
  </svg>`,
};

// ============================================================================
// Background Script Communication
// ============================================================================

async function fetchSpacesViaBackground(): Promise<SpacesResponse> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: "fetchSpaces" }, (response) => {
      if (chrome.runtime.lastError) {
        resolve({ success: false, error: chrome.runtime.lastError.message });
      } else {
        resolve(response || { success: false, error: "No response" });
      }
    });
  });
}

async function addLinkToSpaceViaBackground(spaceId: string, linkId: string): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: "addLinkToSpace", spaceId, linkId }, (response) => {
      if (chrome.runtime.lastError) {
        resolve({ success: false, error: chrome.runtime.lastError.message });
      } else {
        resolve(response || { success: false, error: "No response" });
      }
    });
  });
}

// ============================================================================
// Overlay State
// ============================================================================

let overlayElement: HTMLElement | null = null;
let hideTimeout: number | null = null;
let clickOutsideHandler: ((e: MouseEvent) => void) | null = null;
let currentLinkId: string | null = null;
let isHovering = false;
let spacesExpanded = false;
let spacesCache: Space[] | null = null;
let selectedSpaces: Set<string> = new Set();

// ============================================================================
// Message Listener
// ============================================================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "showSaveOverlay") {
    const { state, message, linkId } = request;

    if (linkId) {
      currentLinkId = linkId;
    }

    if (state === "loading") {
      showOverlay("Saving to Cadie...", "loading", false);
    } else if (state === "success") {
      showOverlay("Saved to Cadie", "success", true);
      startHideTimer(2500);
    } else if (state === "duplicate") {
      showOverlay("Already in Cadie", "duplicate", true);
      startHideTimer(2500);
    } else if (state === "error") {
      showOverlay(message || "Failed to save", "error", false);
      startHideTimer(3000);
    } else if (state === "auth-required") {
      showAuthPromptOverlay();
    }
    sendResponse({ success: true });
  }

  return true;
});

// ============================================================================
// Timer Management
// ============================================================================

function startHideTimer(delay: number) {
  if (hideTimeout) {
    clearTimeout(hideTimeout);
  }
  hideTimeout = window.setTimeout(() => {
    if (!isHovering && !spacesExpanded) {
      hideOverlay();
    }
  }, delay);
}

// ============================================================================
// Click Outside Handler
// ============================================================================

function setupClickOutsideHandler() {
  // Remove existing handler if any
  removeClickOutsideHandler();

  clickOutsideHandler = (e: MouseEvent) => {
    if (!overlayElement || !spacesExpanded) {
      return;
    }

    // Check if click is outside the overlay
    const target = e.target as Node;
    if (overlayElement.contains(target)) {
      // Click is inside - do nothing
      return;
    }

    // Click is outside and spaces are expanded - hide immediately
    hideOverlay();
  };

  // Add listener with capture to catch events early
  document.addEventListener("click", clickOutsideHandler, true);
}

function removeClickOutsideHandler() {
  if (clickOutsideHandler) {
    document.removeEventListener("click", clickOutsideHandler, true);
    clickOutsideHandler = null;
  }
}

// ============================================================================
// Overlay Display
// ============================================================================

function showOverlay(text: string, state: "loading" | "success" | "error" | "duplicate", showSpacesRow: boolean = false) {
  if (hideTimeout) {
    clearTimeout(hideTimeout);
    hideTimeout = null;
  }

  spacesExpanded = false;
  selectedSpaces.clear();

  // If overlay exists, update content with transition
  if (overlayElement && document.body.contains(overlayElement)) {
    const card = overlayElement.querySelector(".cadie-overlay-card");
    const icon = overlayElement.querySelector(".cadie-overlay-icon");
    const textEl = overlayElement.querySelector(".cadie-overlay-text");
    const spacesRow = overlayElement.querySelector(".cadie-spaces-row");

    if (card && icon && textEl) {
      card.classList.add("cadie-fading");
      card.classList.remove("cadie-fade-in");

      setTimeout(() => {
        icon.setAttribute("data-state", state);
        icon.innerHTML = getIconHTML(state);
        textEl.textContent = text;

        if (spacesRow) {
          if (showSpacesRow) {
            spacesRow.classList.remove("cadie-hidden");
          } else {
            spacesRow.classList.add("cadie-hidden");
          }
        }

        card.classList.remove("cadie-fading");
        card.classList.add("cadie-fade-in");
      }, 90);

      return;
    }
  }

  // Create new overlay
  overlayElement = document.createElement("div");
  overlayElement.id = "cadie-save-overlay";

  overlayElement.addEventListener("mouseenter", () => {
    isHovering = true;
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }
  });

  overlayElement.addEventListener("mouseleave", () => {
    isHovering = false;
    if (!spacesExpanded) {
      startHideTimer(1000);
    }
  });

  // Outer container (glassmorphism)
  const content = document.createElement("div");
  content.className = "cadie-overlay-content";

  // Inner wrapper (margin)
  const inner = document.createElement("div");
  inner.className = "cadie-overlay-inner";

  // White card with shadow
  const card = document.createElement("div");
  card.className = "cadie-overlay-card";

  // Icon
  const icon = document.createElement("div");
  icon.className = "cadie-overlay-icon";
  icon.setAttribute("data-state", state);
  icon.innerHTML = getIconHTML(state);

  // Text container
  const textContainer = document.createElement("div");
  textContainer.className = "cadie-overlay-text-container";

  const textEl = document.createElement("div");
  textEl.className = "cadie-overlay-text";
  textEl.textContent = text;

  textContainer.appendChild(textEl);
  card.appendChild(icon);
  card.appendChild(textContainer);
  inner.appendChild(card);
  content.appendChild(inner);

  // Add "Add to space" row (shown on hover for success/duplicate)
  const spacesRow = createSpacesRow();
  if (!showSpacesRow) {
    spacesRow.classList.add("cadie-hidden");
  }
  content.appendChild(spacesRow);

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

// ============================================================================
// Spaces Row Component
// ============================================================================

function createSpacesRow(): HTMLElement {
  const spacesRow = document.createElement("div");
  spacesRow.className = "cadie-spaces-row";

  // Header row
  const header = document.createElement("div");
  header.className = "cadie-spaces-header";

  const headerText = document.createElement("span");
  headerText.className = "cadie-spaces-header-text";
  headerText.textContent = "Add to space";

  const chevron = document.createElement("span");
  chevron.className = "cadie-spaces-chevron";
  chevron.innerHTML = TABLER_ICONS.chevronDown;

  header.appendChild(headerText);
  header.appendChild(chevron);

  // Expandable content
  const expandable = document.createElement("div");
  expandable.className = "cadie-spaces-expandable";

  // Loading placeholder
  const loading = document.createElement("div");
  loading.className = "cadie-spaces-loading";
  loading.innerHTML = `<div class="cadie-spinner-small"></div>`;
  expandable.appendChild(loading);

  spacesRow.appendChild(header);
  spacesRow.appendChild(expandable);

  // Toggle expansion on header click
  header.addEventListener("click", async () => {
    spacesExpanded = !spacesExpanded;
    spacesRow.classList.toggle("cadie-expanded", spacesExpanded);

    // Also toggle expanded class on content for background change
    const content = spacesRow.closest(".cadie-overlay-content");
    if (content) {
      content.classList.toggle("cadie-expanded", spacesExpanded);
    }

    if (spacesExpanded) {
      if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
      }

      // Setup click-outside handler when expanded
      setupClickOutsideHandler();

      if (!spacesCache) {
        const response = await fetchSpacesViaBackground();
        if (response.success && response.spaces) {
          spacesCache = response.spaces;
        } else {
          spacesCache = [];
        }
      }

      renderSpaceList(expandable, spacesCache);
    } else {
      // Remove click-outside handler when collapsed
      removeClickOutsideHandler();
    }
  });

  return spacesRow;
}

// ============================================================================
// Space List Renderer (list style, not chips)
// ============================================================================

function renderSpaceList(container: HTMLElement, spaces: Space[]) {
  container.innerHTML = "";

  if (spaces.length === 0) {
    const empty = document.createElement("div");
    empty.className = "cadie-spaces-empty";
    empty.textContent = "No spaces yet";
    container.appendChild(empty);
    return;
  }

  const list = document.createElement("div");
  list.className = "cadie-space-list";

  spaces.forEach((space) => {
    const item = document.createElement("button");
    item.className = "cadie-space-item";
    item.setAttribute("data-space-id", space.id);

    const isSelected = selectedSpaces.has(space.id);
    if (isSelected) {
      item.classList.add("cadie-selected");
    }

    // Content wrapper (dot + name)
    const content = document.createElement("div");
    content.className = "cadie-space-item-content";

    // Color dot (pill shape)
    const dot = document.createElement("span");
    dot.className = "cadie-space-dot";
    dot.style.backgroundColor = space.color;

    // Name
    const name = document.createElement("span");
    name.className = "cadie-space-name";
    name.textContent = space.name;

    content.appendChild(dot);
    content.appendChild(name);
    item.appendChild(content);

    // Checkmark (shown when selected)
    const checkContainer = document.createElement("span");
    checkContainer.className = "cadie-space-check";
    if (isSelected) {
      checkContainer.innerHTML = TABLER_ICONS.check;
    }
    item.appendChild(checkContainer);

    // Toggle selection on click
    item.addEventListener("click", async () => {
      if (!currentLinkId) return;

      const wasSelected = selectedSpaces.has(space.id);

      if (wasSelected) {
        selectedSpaces.delete(space.id);
        item.classList.remove("cadie-selected");
        checkContainer.innerHTML = "";
      } else {
        item.classList.add("cadie-loading");
        const response = await addLinkToSpaceViaBackground(space.id, currentLinkId);
        item.classList.remove("cadie-loading");

        if (response.success) {
          selectedSpaces.add(space.id);
          item.classList.add("cadie-selected");
          checkContainer.innerHTML = TABLER_ICONS.check;
        }
      }
    });

    list.appendChild(item);
  });

  container.appendChild(list);
}

// ============================================================================
// Icon Renderer
// ============================================================================

function getIconHTML(state: "loading" | "success" | "error" | "duplicate"): string {
  if (state === "loading") {
    return `<div class="cadie-spinner">${TABLER_ICONS.loader}</div>`;
  } else if (state === "success") {
    return TABLER_ICONS.circleCheckFilled;
  } else if (state === "duplicate") {
    return TABLER_ICONS.alertTriangleFilled;
  } else {
    return TABLER_ICONS.circleXFilled;
  }
}

// ============================================================================
// Hide Overlay
// ============================================================================

function hideOverlay() {
  if (overlayElement) {
    // Clean up click-outside handler
    removeClickOutsideHandler();
    
    overlayElement.classList.add("cadie-hiding");
    setTimeout(() => {
      if (overlayElement) {
        overlayElement.remove();
        overlayElement = null;
      }
      currentLinkId = null;
      isHovering = false;
      spacesExpanded = false;
      selectedSpaces.clear();
    }, 200);
  }
}

// ============================================================================
// Auth Prompt Overlay
// ============================================================================

function showAuthPromptOverlay() {
  if (hideTimeout) {
    clearTimeout(hideTimeout);
    hideTimeout = null;
  }

  if (overlayElement) {
    overlayElement.remove();
    overlayElement = null;
  }

  overlayElement = document.createElement("div");
  overlayElement.id = "cadie-save-overlay";
  overlayElement.className = "cadie-auth-prompt";

  const content = document.createElement("div");
  content.className = "cadie-overlay-content cadie-auth-content";

  const inner = document.createElement("div");
  inner.className = "cadie-overlay-inner";

  const card = document.createElement("div");
  card.className = "cadie-overlay-card";

  // Icon
  const icon = document.createElement("div");
  icon.className = "cadie-overlay-icon";
  icon.setAttribute("data-state", "auth");
  icon.innerHTML = TABLER_ICONS.login;

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
  closeBtn.innerHTML = TABLER_ICONS.x;
  closeBtn.addEventListener("click", () => hideOverlay());

  card.appendChild(icon);
  card.appendChild(textEl);
  card.appendChild(connectBtn);
  card.appendChild(closeBtn);
  inner.appendChild(card);
  content.appendChild(inner);
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

// ============================================================================
// Authorization Flow
// ============================================================================

let authProcessed = false;

const ALLOWED_AUTH_ORIGINS = [
  "https://cadie.app",
  "https://www.cadie.app",
];

window.addEventListener("message", (event: MessageEvent) => {
  if (event.source !== window) return;
  if (!ALLOWED_AUTH_ORIGINS.includes(event.origin)) return;
  if (!window.location.hostname.includes("cadie.app")) return;
  
  const data = event.data;
  if (data?.type === "CADIE_AUTH_SUCCESS" && data?.token && !authProcessed) {
    authProcessed = true;
    console.log("[Cadie] Content script received token, length:", data.token?.length || 0);
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
        authProcessed = false;
      } else {
        window.postMessage({ type: "CADIE_AUTH_ACK", success: true }, "*");
      }
    });
  }
});

if (window.location.hostname.includes("cadie.app") && window.location.pathname.includes("/extension/authorize")) {
  checkForAuthData();

  const pollInterval = setInterval(() => {
    if (checkForAuthData()) {
      clearInterval(pollInterval);
    }
  }, 500);

  setTimeout(() => clearInterval(pollInterval), 10000);
}

function checkForAuthData(): boolean {
  if (authProcessed) return true;
  
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
            url: "https://cadie.app",
            cadieUrl: "https://cadie.app",
            state: authData.state,
          },
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.error("Error sending auth message:", chrome.runtime.lastError);
            authProcessed = false;
          } else {
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
