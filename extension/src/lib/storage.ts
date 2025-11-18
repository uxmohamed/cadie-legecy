/**
 * Chrome storage utilities for extension settings
 */

export interface ExtensionSettings {
  apiToken?: string;
  vaultUrl?: string;
  userEmail?: string;
}

// Default to production URL
const DEFAULT_VAULT_URL = "https://vault-theta-lac.vercel.app";

/**
 * Get extension settings from Chrome storage
 */
export async function getSettings(): Promise<ExtensionSettings> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(
      {
        apiToken: "",
        vaultUrl: DEFAULT_VAULT_URL,
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
 * Get Vault URL
 */
export async function getVaultUrl(): Promise<string> {
  const settings = await getSettings();
  return settings.vaultUrl || DEFAULT_VAULT_URL;
}

