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

// Default to production URL
export const EXTENSION_CONFIG = {
  API_URL: "https://cadie.app/api",
  BASE_URL: "https://cadie.app",
};

// Default to production URL
const DEFAULT_CADIE_URL = EXTENSION_CONFIG.BASE_URL;

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
      promises.push(
        new Promise<void>((res) => {
          chrome.storage.local.set({ apiToken: settings.apiToken }, () => res());
        })
      );
    }
    
    // Store non-sensitive data in sync storage
    const syncSettings: SyncSettings = {};
    if (settings.cadieUrl !== undefined) {
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
      resolve((items as SyncSettings).cadieUrl || DEFAULT_CADIE_URL);
    });
  });
}

