/**
 * Chrome storage utilities for extension settings
 */

export interface ExtensionSettings {
  apiToken?: string;
  caddyUrl?: string;
  userEmail?: string;
}

// Default to production URL
export const EXTENSION_CONFIG = {
  API_URL: "https://caddy-ed0.pages.dev/api",
  BASE_URL: "https://caddy-ed0.pages.dev",
};

// Default to production URL
const DEFAULT_CADDY_URL = EXTENSION_CONFIG.BASE_URL;

/**
 * Get extension settings from Chrome storage
 */
export async function getSettings(): Promise<ExtensionSettings> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(
      {
        apiToken: "",
        caddyUrl: DEFAULT_CADDY_URL,
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
  return settings.apiToken;
}

/**
 * Get Caddy URL
 */
export async function getCaddyUrl(): Promise<string> {
  const settings = await getSettings();
  return settings.caddyUrl || DEFAULT_CADDY_URL;
}

