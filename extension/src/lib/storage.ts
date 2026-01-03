/**
 * Chrome storage utilities for extension settings
 */

export interface ExtensionSettings {
  apiToken?: string;
  cadieUrl?: string;
  userEmail?: string;
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
 */
export async function getSettings(): Promise<ExtensionSettings> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(
      {
        apiToken: "",
        cadieUrl: DEFAULT_CADIE_URL,
        userEmail: "",
      },
      (items) => {
        resolve(items as ExtensionSettings);
      }
    );
  });
}

/**
 * Save extension settings to Chrome storage
 */
export async function saveSettings(settings: Partial<ExtensionSettings>): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set(settings, () => {
      resolve();
    });
  });
}

/**
 * Clear all extension settings
 */
export async function clearSettings(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.clear(() => {
      resolve();
    });
  });
}

/**
 * Get API token
 */
export async function getApiToken(): Promise<string | undefined> {
  const settings = await getSettings();
  const token = settings.apiToken;
  console.log("[Cadie Storage] getApiToken:", { 
    hasToken: !!token, 
    length: token?.length || 0,
    type: typeof token
  });
  return token || undefined;
}

/**
 * Get Cadie URL
 */
export async function getCadieUrl(): Promise<string> {
  const settings = await getSettings();
  return settings.cadieUrl || DEFAULT_CADIE_URL;
}

