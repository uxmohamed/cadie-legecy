/**
 * Cadie API client for Chrome extension
 * Minimal - just saves URLs to Cadie
 */

import { getApiToken, getCadieUrl, clearSettings } from "./storage";

/** Request to save a link - only URL is required! */
export interface SaveLinkRequest {
  url: string;
}

export interface ApiResponse {
  success: boolean;
  error?: string;
  duplicate?: boolean;
}

/**
 * Save a link to Cadie
 */
export async function saveLink(request: SaveLinkRequest): Promise<ApiResponse> {
  try {
    const token = await getApiToken();
    const cadieUrl = await getCadieUrl();
    
    if (!token || token.length < 32) {
      return { success: false, error: "Not connected. Please connect in settings." };
    }

    const response = await fetch(`${cadieUrl}/api/links`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Don't auto-clear settings - let user manually disconnect
        // This prevents cascading issues where one failed request clears everything
        return { success: false, error: "Auth failed. Please reconnect in settings." };
      }
      // Try to get the actual error message from the response
      try {
        const errorData = await response.json();
        const errorMsg = errorData?.error?.message || errorData?.error || errorData?.details?.[0]?.message || `Error ${response.status}`;
        return { success: false, error: String(errorMsg) };
      } catch {
        return { success: false, error: `Error ${response.status}` };
      }
    }

    const data = await response.json();
    return { success: true, duplicate: data.duplicate === true };
  } catch (error) {
    return { success: false, error: "Network error" };
  }
}
