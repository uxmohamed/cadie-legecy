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
}

// Non-sensitive settings stored in sync storage
interface SyncSettings {
  cadieUrl?: string;
  userEmail?: string;
}

// Sensitive settings stored in local storage (not synced across devices)
interface LocalSettings {
  apiToken?: string;
}

const PROD_CADIE_URL = "https://cadie.app";
const DEV_CADIE_URL = "http://localhost:3000";
declare const __DEV__: boolean;

function resolveDefaultCadieUrl(): string {
  if (__DEV__) {
    return DEV_CADIE_URL;
  }
  return PROD_CADIE_URL;
}

// Default to localhost in dev builds, production in prod builds
const DEFAULT_CADIE_URL = resolveDefaultCadieUrl();

export const EXTENSION_CONFIG = {
  API_URL: `${DEFAULT_CADIE_URL}/api`,
  BASE_URL: DEFAULT_CADIE_URL,
};

function isAllowedCadieOrigin(url: URL): boolean {
  const isProd =
    url.protocol === "https:" &&
    (url.hostname === "cadie.app" || url.hostname === "www.cadie.app");
  const isLocalDev =
    (url.protocol === "http:" || url.protocol === "https:") &&
    (url.hostname === "localhost" || url.hostname === "127.0.0.1");
  return isProd || isLocalDev;
}

export function normalizeCadieUrl(value?: string): string {
  if (!value) return DEFAULT_CADIE_URL;
  try {
    const parsed = new URL(value);
    if (isAllowedCadieOrigin(parsed)) {
      return parsed.origin;
    }
  } catch {
    // Ignore invalid values and fall back to default
  }
  return DEFAULT_CADIE_URL;
}

/**
 * Get extension settings from Chrome storage
 * Combines local (sensitive) and sync (non-sensitive) storage
 */
export async function getSettings(): Promise<ExtensionSettings> {
  return new Promise((resolve) => {
    // Get sensitive data from local storage (not synced)
    chrome.storage.local.get({ apiToken: "" }, (localItems) => {
      // Get non-sensitive data from sync storage
      chrome.storage.sync.get(
        {
          cadieUrl: DEFAULT_CADIE_URL,
          userEmail: "",
        },
        (syncItems) => {
          resolve({
            apiToken: (localItems as LocalSettings).apiToken,
            cadieUrl: normalizeCadieUrl((syncItems as SyncSettings).cadieUrl),
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
      promises.push(
        new Promise<void>((res) => {
          chrome.storage.local.set({ apiToken: settings.apiToken }, () => res());
        })
      );
    }
    
    // Store non-sensitive data in sync storage
    const syncSettings: SyncSettings = {};
    if (settings.cadieUrl !== undefined) {
      syncSettings.cadieUrl = normalizeCadieUrl(settings.cadieUrl);
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
    // Clear both storage areas
    chrome.storage.local.clear(() => {
      chrome.storage.sync.clear(() => {
        resolve();
      });
    });
  });
}

/**
 * Get API token from local storage (not synced)
 */
export async function getApiToken(): Promise<string | undefined> {
  return new Promise((resolve) => {
    chrome.storage.local.get({ apiToken: "" }, (items) => {
      resolve((items as LocalSettings).apiToken || undefined);
    });
  });
}

/**
 * Get Cadie URL from sync storage
 */
export async function getCadieUrl(): Promise<string> {
  return new Promise((resolve) => {
    chrome.storage.sync.get({ cadieUrl: DEFAULT_CADIE_URL }, (items) => {
      resolve(normalizeCadieUrl((items as SyncSettings).cadieUrl));
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
  return new Promise((resolve) => {
    chrome.storage.local.get({ pendingUrl: "" }, (items) => {
      resolve(items.pendingUrl || undefined);
    });
  });
}

/**
 * Set pending URL to save after authentication
 */
export async function setPendingUrl(url: string): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ pendingUrl: url }, () => resolve());
  });
}

/**
 * Clear pending URL after it has been saved
 */
export async function clearPendingUrl(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.remove("pendingUrl", () => resolve());
  });
}
