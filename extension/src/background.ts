/**
 * Background service worker for Cadie extension
 * Handles context menus, keyboard shortcuts, and saving links
 */

import {
  saveLink,
  fetchSpaces,
  addLinkToSpace,
  removeLinkFromSpace,
  fetchLinkSpaces,
  fetchLinkContext,
} from "./lib/api-client";
import {
  clearAuthSession,
  clearPendingUrl,
  getApiToken,
  getAuthSession,
  getInstallId,
  getPendingUrl,
  setAuthSession,
  setPendingUrl,
} from "./lib/storage";

// Track saves in progress to prevent duplicates
const savesInProgress = new Set<string>();
const LOADING_OVERLAY_DELAY_MS = 450;
const AUTH_SESSION_TTL_MS = 5 * 60 * 1000;
let authValidationInFlight = false;

// ============================================================================
// EVENT LISTENERS - Register at top level for persistence across SW lifecycle
// ============================================================================

// Install listener - Create context menu
chrome.runtime.onInstalled.addListener(() => {
  // Remove any existing context menus first to prevent duplicate ID errors
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "save-to-cadie",
      title: "Save to Cadie",
      contexts: ["page", "link", "selection"],
    });
  });
});

// Context menu click listener
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "save-to-cadie" && tab?.id) {
    // Use linkUrl if right-clicking a link, otherwise use pageUrl or tab.url
    const urlToSave = info.linkUrl || info.pageUrl || tab.url;
    if (urlToSave) {
      await saveUrl(tab.id, urlToSave);
    }
  }
});

// Extension icon/keyboard shortcut click listener - save page directly
chrome.action.onClicked.addListener(async (tab) => {
  if (tab?.id && tab.url) {
    await saveUrl(tab.id, tab.url);
  }
});

// Message listener - Handle messages from popup/content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "saveCurrentTab") {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs[0]?.id && tabs[0].url) {
        await saveUrl(tabs[0].id, tabs[0].url);
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: "No active tab" });
      }
    });
    return true; // Keep message channel open for async response
  }

  // Handle open auth page request from content script
  if (request.action === "openAuthPage") {
    void openAuthPage().then(sendResponse);
    return true;
  }

  // Handle fetchSpaces request from content script (content scripts can't make cross-origin requests)
  if (request.action === "fetchSpaces") {
    fetchSpaces().then(response => {
      sendResponse(response);
    });
    return true; // Keep message channel open for async response
  }

  // Handle addLinkToSpace request from content script
  if (request.action === "addLinkToSpace") {
    addLinkToSpace(request.spaceId, request.linkId).then(response => {
      sendResponse(response);
    });
    return true;
  }

  // Handle removeLinkFromSpace request from content script
  if (request.action === "removeLinkFromSpace") {
    removeLinkFromSpace(request.spaceId, request.linkId).then(response => {
      sendResponse(response);
    });
    return true;
  }

  // Handle fetchLinkSpaces request from content script
  if (request.action === "fetchLinkSpaces") {
    fetchLinkSpaces(request.linkId).then(response => {
      sendResponse(response);
    });
    return true; // Keep message channel open for async response
  }

  // Handle fetchLinkContext request from content script (single round-trip)
  if (request.action === "fetchLinkContext") {
    fetchLinkContext(request.linkId).then((response) => {
      sendResponse(response);
    });
    return true;
  }

  // Handle authorization success from content script
  if (request.type === "CADIE_AUTH_SUCCESS" && request.data) {
    void handleAuthorizationSuccess(request.data).then(sendResponse);
    return true;
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Save a URL to Cadie
 * Shows brief loading state, then actual result from API
 * @param tabId - The tab ID to show overlays in
 * @param url - The URL to save
 */
async function saveUrl(tabId: number, url: string): Promise<void> {
  const startedAt = performance.now();
  const idempotencyKey = `ext-save-${crypto.randomUUID()}`;
  let loadingOverlayTimeout: ReturnType<typeof setTimeout> | null = null;
  // Create a unique key for this save operation
  const saveKey = url;

  // Check if we're already saving this URL
  if (savesInProgress.has(saveKey)) {
    return;
  }

  // Mark this URL as being saved
  savesInProgress.add(saveKey);

  try {
    // Don't save chrome:// or extension pages
    if (
      url.startsWith("chrome://") ||
      url.startsWith("chrome-extension://") ||
      url.startsWith("about:")
    ) {
      showOverlayInTab(tabId, "error", "Cannot save browser pages");
      return;
    }

    // Check if token is configured and valid (should be 43+ characters)
    const token = await getApiToken();

    if (!token || token.length < 32) {
      // Not connected - store the pending URL and show auth prompt overlay
      await setPendingUrl(url);
      showOverlayInTab(tabId, "auth-required");
      return;
    }

    // Avoid flashing a spinner for fast saves. Only show loading if the request
    // is genuinely taking long enough that the user would otherwise see nothing.
    loadingOverlayTimeout = setTimeout(() => {
      showOverlayInTab(tabId, "loading");
    }, LOADING_OVERLAY_DELAY_MS);

    // Save to Cadie with retry logic - will update overlay with result
    await saveWithRetry(tabId, url, 2, startedAt, idempotencyKey);
  } finally {
    if (loadingOverlayTimeout) {
      clearTimeout(loadingOverlayTimeout);
    }
    // Remove the save lock
    savesInProgress.delete(saveKey);
  }
}

/**
 * Save link with retry logic
 * @param tabId - Tab ID for showing result overlay
 * @param url - URL to save
 * @param maxRetries - Maximum number of retry attempts
 */
async function saveWithRetry(
  tabId: number,
  url: string,
  maxRetries: number,
  startedAt: number,
  idempotencyKey: string
): Promise<void> {
  let lastError: string | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await saveLink({ url }, { idempotencyKey });

      if (response.success) {
        // Show appropriate result with linkId for space assignment
        if (response.duplicate) {
          showOverlayInTab(tabId, "duplicate", undefined, response.linkId);
        } else {
          showOverlayInTab(tabId, "success", undefined, response.linkId);
        }
        console.info("[CadieExtPerf]", {
          event: "save_complete",
          duplicate: response.duplicate === true,
          attempts: attempt,
          durationMs: Math.round(performance.now() - startedAt),
        });
        return;
      }

      // Check if auth failed - show auth prompt
      if (response.authFailed) {
        await setPendingUrl(url);
        showOverlayInTab(tabId, "auth-required");
        return;
      }

      // Other error - store for potential retry
      lastError = response.error || "Failed to save";

      if (!response.retryable) {
        break;
      }

    } catch (error) {
      lastError = error instanceof Error ? error.message : "Failed to save";
    }

    // Wait before retry (exponential backoff: 500ms, 1000ms, 2000ms)
    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 250 * Math.pow(2, attempt - 1)));
    }
  }

  // All retries failed - show error to user
  console.error(`Failed to save URL after ${maxRetries} attempts:`, lastError);
  console.info("[CadieExtPerf]", {
    event: "save_failed",
    attempts: maxRetries,
    durationMs: Math.round(performance.now() - startedAt),
    error: lastError || "Failed to save",
  });
  showOverlayInTab(tabId, "error", lastError || "Failed to save");
}

async function openAuthPage(): Promise<{ success: boolean; error?: string }> {
  try {
    const extensionId = chrome.runtime.id;
    const installId = await getInstallId();
    const extensionVersion = chrome.runtime.getManifest().version;
    const authSession = {
      state: crypto.randomUUID(),
      installId,
      extensionId,
      extensionVersion,
      browserName: "chrome",
      createdAt: Date.now(),
      expiresAt: Date.now() + AUTH_SESSION_TTL_MS,
    };

    await setAuthSession(authSession);

    const authUrl = new URL("https://cadie.app/extension/authorize");
    authUrl.searchParams.set("extensionId", authSession.extensionId);
    authUrl.searchParams.set("installId", authSession.installId);
    authUrl.searchParams.set("extensionVersion", authSession.extensionVersion);
    authUrl.searchParams.set("browserName", authSession.browserName);
    authUrl.searchParams.set("state", authSession.state);

    await chrome.tabs.create({ url: authUrl.toString() });
    return { success: true };
  } catch (error) {
    console.error("Failed to open auth page:", error);
    return { success: false, error: "Failed to open auth page" };
  }
}

interface AuthSuccessMessage {
  token?: string;
  email?: string;
  state?: string;
  installId?: string;
  extensionId?: string;
}

async function handleAuthorizationSuccess(
  data: AuthSuccessMessage
): Promise<{ success: boolean; error?: string }> {
  if (!data.token || !data.state || !data.installId || !data.extensionId) {
    return { success: false, error: "Incomplete auth payload" };
  }

  const validation = await validateAndConsumeAuthSession({
    state: data.state,
    installId: data.installId,
    extensionId: data.extensionId,
  });
  if (!validation.success) {
    return validation;
  }

  const cadieUrlToUse = "https://cadie.app";

  await chrome.storage.local.set({ apiToken: data.token });
  await chrome.storage.sync.set({
    cadieUrl: cadieUrlToUse,
    userEmail: data.email || "",
  });

  chrome.runtime.sendMessage({
    type: "CADIE_AUTH_COMPLETE",
    data: { cadieUrl: cadieUrlToUse },
  }).catch(() => {
    // Options page might not be listening, that's okay.
  });

  const pendingUrl = await getPendingUrl();
  if (pendingUrl) {
    await clearPendingUrl();
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      await saveUrl(tab.id, pendingUrl);
    }
  }

  return { success: true };
}

async function validateAndConsumeAuthSession(
  data: Required<Pick<AuthSuccessMessage, "state" | "installId" | "extensionId">>
): Promise<{ success: boolean; error?: string }> {
  if (authValidationInFlight) {
    return { success: false, error: "Authorization already being processed" };
  }

  authValidationInFlight = true;
  try {
    const authSession = await getAuthSession();
    if (!authSession) {
      return { success: false, error: "No pending auth session" };
    }

    if (authSession.expiresAt <= Date.now()) {
      await clearAuthSession();
      return { success: false, error: "Auth session expired" };
    }

    if (
      authSession.state !== data.state ||
      authSession.installId !== data.installId ||
      authSession.extensionId !== data.extensionId
    ) {
      return { success: false, error: "Auth session did not match" };
    }

    await clearAuthSession();
    return { success: true };
  } finally {
    authValidationInFlight = false;
  }
}

/**
 * Show overlay in tab (in-page notification, not OS notification)
 */
function showOverlayInTab(
  tabId: number,
  state: "loading" | "success" | "error" | "duplicate" | "auth-required",
  message?: string,
  linkId?: string
): void {
  chrome.tabs.sendMessage(tabId, {
    action: "showSaveOverlay",
    state,
    message,
    linkId,
  }).catch(() => {
    // Content script not available on this page, silently ignore
  });
}
