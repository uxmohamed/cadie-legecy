/**
 * Chrome storage utilities for extension settings
 * 
 * SECURITY: Sensitive data (API token) is stored in local storage (not synced)
 * Non-sensitive settings (URL, email) are stored in sync storage
 */

export interface ExtensionSettings {
  apiToken?: string;
  cadieUrl?: string;
  userEmail?: string;
  installId?: string;
}

export interface ExtensionAuthSession {
  state: string;
  installId: string;
  extensionId: string;
  extensionVersion: string;
  browserName: string;
  createdAt: number;
  expiresAt: number;
}

// Non-sensitive settings stored in sync storage
interface SyncSettings {
  cadieUrl?: string;
  userEmail?: string;
}

// Sensitive settings stored in local storage (not synced across devices)
interface LocalSettings {
  apiToken?: string;
  pendingUrl?: string;
  installId?: string;
  authSession?: ExtensionAuthSession;
}

// Default to production URL
export const EXTENSION_CONFIG = {
  API_URL: "https://cadie.app/api",
  BASE_URL: "https://cadie.app",
};

// Default to production URL
const DEFAULT_CADIE_URL = EXTENSION_CONFIG.BASE_URL;

let cachedApiToken: string | undefined;
let isApiTokenLoaded = false;
let cachedCadieUrl: string = DEFAULT_CADIE_URL;
let isCadieUrlLoaded = false;
let cachedPendingUrl: string | undefined;
let isPendingUrlLoaded = false;
let cachedInstallId: string | undefined;
let isInstallIdLoaded = false;
let cachedAuthSession: ExtensionAuthSession | undefined;
let isAuthSessionLoaded = false;

if (typeof chrome !== "undefined" && chrome.storage?.onChanged) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local") {
      if (changes.apiToken) {
        cachedApiToken = (changes.apiToken.newValue as string | undefined) || undefined;
        isApiTokenLoaded = true;
      }
      if (changes.pendingUrl) {
        cachedPendingUrl = (changes.pendingUrl.newValue as string | undefined) || undefined;
        isPendingUrlLoaded = true;
      }
      if (changes.installId) {
        cachedInstallId = (changes.installId.newValue as string | undefined) || undefined;
        isInstallIdLoaded = true;
      }
      if (changes.authSession) {
        cachedAuthSession = (changes.authSession.newValue as ExtensionAuthSession | undefined) || undefined;
        isAuthSessionLoaded = true;
      }
    }

    if (areaName === "sync" && changes.cadieUrl) {
      cachedCadieUrl = (changes.cadieUrl.newValue as string | undefined) || DEFAULT_CADIE_URL;
      isCadieUrlLoaded = true;
    }
  });
}

/**
 * Get extension settings from Chrome storage
 * Combines local (sensitive) and sync (non-sensitive) storage
 */
export async function getSettings(): Promise<ExtensionSettings> {
  return new Promise((resolve) => {
    // Get sensitive data from local storage (not synced)
    chrome.storage.local.get({ apiToken: "", installId: "" }, (localItems) => {
      // Get non-sensitive data from sync storage
      chrome.storage.sync.get(
        {
          cadieUrl: DEFAULT_CADIE_URL,
          userEmail: "",
        },
        (syncItems) => {
          resolve({
            apiToken: (localItems as LocalSettings).apiToken,
            installId: (localItems as LocalSettings).installId,
            cadieUrl: (syncItems as SyncSettings).cadieUrl,
            userEmail: (syncItems as SyncSettings).userEmail,
          });
        }
      );
    });
  });
}

/**
 * Save extension settings to Chrome storage
 * SECURITY: Stores sensitive data in local storage (not synced)
 */
export async function saveSettings(settings: Partial<ExtensionSettings>): Promise<void> {
  return new Promise((resolve) => {
    const promises: Promise<void>[] = [];
    
    // Store sensitive data in local storage (not synced across devices)
    if (settings.apiToken !== undefined) {
      cachedApiToken = settings.apiToken || undefined;
      isApiTokenLoaded = true;
      promises.push(
        new Promise<void>((res) => {
          chrome.storage.local.set({ apiToken: settings.apiToken }, () => res());
        })
      );
    }

    if (settings.installId !== undefined) {
      cachedInstallId = settings.installId || undefined;
      isInstallIdLoaded = true;
      promises.push(
        new Promise<void>((res) => {
          chrome.storage.local.set({ installId: settings.installId }, () => res());
        })
      );
    }
    
    // Store non-sensitive data in sync storage
    const syncSettings: SyncSettings = {};
    if (settings.cadieUrl !== undefined) {
      cachedCadieUrl = settings.cadieUrl || DEFAULT_CADIE_URL;
      isCadieUrlLoaded = true;
      syncSettings.cadieUrl = settings.cadieUrl;
    }
    if (settings.userEmail !== undefined) {
      syncSettings.userEmail = settings.userEmail;
    }
    
    if (Object.keys(syncSettings).length > 0) {
      promises.push(
        new Promise<void>((res) => {
          chrome.storage.sync.set(syncSettings, () => res());
        })
      );
    }
    
    Promise.all(promises).then(() => resolve());
  });
}

/**
 * Clear all extension settings
 * Clears both local and sync storage
 */
export async function clearSettings(): Promise<void> {
  return new Promise((resolve) => {
    cachedApiToken = undefined;
    isApiTokenLoaded = true;
    cachedCadieUrl = DEFAULT_CADIE_URL;
    isCadieUrlLoaded = true;
    cachedPendingUrl = undefined;
    isPendingUrlLoaded = true;
    cachedAuthSession = undefined;
    isAuthSessionLoaded = true;
    isInstallIdLoaded = false;
    // Clear both storage areas
    chrome.storage.local.get({ installId: "" }, (items) => {
      const installId = (items as LocalSettings).installId || undefined;
      cachedInstallId = installId;
      chrome.storage.local.clear(() => {
        if (installId) {
          chrome.storage.local.set({ installId }, () => {
            chrome.storage.sync.clear(() => {
              resolve();
            });
          });
          return;
        }
        chrome.storage.sync.clear(() => {
          resolve();
        });
      });
    });
  });
}

/**
 * Get API token from local storage (not synced)
 */
export async function getApiToken(): Promise<string | undefined> {
  if (isApiTokenLoaded) {
    return cachedApiToken;
  }

  return new Promise((resolve) => {
    chrome.storage.local.get({ apiToken: "" }, (items) => {
      cachedApiToken = (items as LocalSettings).apiToken || undefined;
      isApiTokenLoaded = true;
      resolve(cachedApiToken);
    });
  });
}

/**
 * Get or create a stable install ID for this extension installation.
 */
export async function getInstallId(): Promise<string> {
  if (isInstallIdLoaded && cachedInstallId) {
    return cachedInstallId;
  }

  return new Promise((resolve) => {
    chrome.storage.local.get({ installId: "" }, (items) => {
      const existing = (items as LocalSettings).installId || undefined;
      if (existing) {
        cachedInstallId = existing;
        isInstallIdLoaded = true;
        resolve(existing);
        return;
      }

      const nextInstallId = crypto.randomUUID();
      cachedInstallId = nextInstallId;
      isInstallIdLoaded = true;
      chrome.storage.local.set({ installId: nextInstallId }, () => resolve(nextInstallId));
    });
  });
}

/**
 * Get the pending extension auth session, if any.
 */
export async function getAuthSession(): Promise<ExtensionAuthSession | undefined> {
  if (isAuthSessionLoaded) {
    return cachedAuthSession;
  }

  return new Promise((resolve) => {
    chrome.storage.local.get({ authSession: undefined }, (items) => {
      cachedAuthSession = (items as LocalSettings).authSession || undefined;
      isAuthSessionLoaded = true;
      resolve(cachedAuthSession);
    });
  });
}

/**
 * Persist the current extension auth session.
 */
export async function setAuthSession(authSession: ExtensionAuthSession): Promise<void> {
  cachedAuthSession = authSession;
  isAuthSessionLoaded = true;
  return new Promise((resolve) => {
    chrome.storage.local.set({ authSession }, () => resolve());
  });
}

/**
 * Clear the current extension auth session.
 */
export async function clearAuthSession(): Promise<void> {
  cachedAuthSession = undefined;
  isAuthSessionLoaded = true;
  return new Promise((resolve) => {
    chrome.storage.local.remove("authSession", () => resolve());
  });
}

/**
 * Get Cadie URL from sync storage
 */
export async function getCadieUrl(): Promise<string> {
  if (isCadieUrlLoaded) {
    return cachedCadieUrl;
  }

  return new Promise((resolve) => {
    chrome.storage.sync.get({ cadieUrl: DEFAULT_CADIE_URL }, (items) => {
      cachedCadieUrl = (items as SyncSettings).cadieUrl || DEFAULT_CADIE_URL;
      isCadieUrlLoaded = true;
      resolve(cachedCadieUrl);
    });
  });
}

// ============================================================================
// PENDING URL STORAGE - For queuing saves during auth flow
// ============================================================================

/**
 * Get pending URL to save after authentication
 */
export async function getPendingUrl(): Promise<string | undefined> {
  if (isPendingUrlLoaded) {
    return cachedPendingUrl;
  }

  return new Promise((resolve) => {
    chrome.storage.local.get({ pendingUrl: "" }, (items) => {
      cachedPendingUrl = (items as LocalSettings).pendingUrl || undefined;
      isPendingUrlLoaded = true;
      resolve(cachedPendingUrl);
    });
  });
}

/**
 * Set pending URL to save after authentication
 */
export async function setPendingUrl(url: string): Promise<void> {
  cachedPendingUrl = url;
  isPendingUrlLoaded = true;
  return new Promise((resolve) => {
    chrome.storage.local.set({ pendingUrl: url }, () => resolve());
  });
}

/**
 * Clear pending URL after it has been saved
 */
export async function clearPendingUrl(): Promise<void> {
  cachedPendingUrl = undefined;
  isPendingUrlLoaded = true;
  return new Promise((resolve) => {
    chrome.storage.local.remove("pendingUrl", () => resolve());
  });
}
