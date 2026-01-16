/**
 * Cadie API client for Chrome extension
 */

import { getApiToken, getCadieUrl, clearSettings } from "./storage";

/** Request to save a link - only URL is required! */
export interface SaveLinkRequest {
  url: string;
}

export interface SaveLinkResponse {
  success: boolean;
  error?: string;
  duplicate?: boolean;
  authFailed?: boolean;
  linkId?: string; // The ID of the saved/existing link
}

export interface Space {
  id: string;
  name: string;
  color: string;
  link_count: number;
}

export interface SpacesResponse {
  success: boolean;
  error?: string;
  spaces?: Space[];
}

/**
 * Save a link to Cadie
 */
export async function saveLink(request: SaveLinkRequest): Promise<SaveLinkResponse> {
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
        await clearSettings();
        return {
          success: false,
          error: "Auth failed. Redirecting to connect...",
          authFailed: true
        };
      }
      try {
        const errorData = await response.json();
        const errorMsg = errorData?.error?.message || errorData?.error || errorData?.details?.[0]?.message || `Error ${response.status}`;
        return { success: false, error: String(errorMsg) };
      } catch {
        return { success: false, error: `Error ${response.status}` };
      }
    }

    const data = await response.json();
    return {
      success: true,
      duplicate: data.duplicate === true,
      linkId: data.link?.id
    };
  } catch (error) {
    return { success: false, error: "Network error" };
  }
}

/**
 * Fetch all spaces for the user
 */
export async function fetchSpaces(): Promise<SpacesResponse> {
  try {
    const token = await getApiToken();
    const cadieUrl = await getCadieUrl();

    if (!token || token.length < 32) {
      return { success: false, error: "Not connected" };
    }

    const response = await fetch(`${cadieUrl}/api/spaces`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return { success: false, error: `Error ${response.status}` };
    }

    const data = await response.json();
    return { success: true, spaces: data.spaces || [] };
  } catch (error) {
    return { success: false, error: "Network error" };
  }
}

/**
 * Add a link to a space
 */
export async function addLinkToSpace(spaceId: string, linkId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const token = await getApiToken();
    const cadieUrl = await getCadieUrl();

    if (!token || token.length < 32) {
      return { success: false, error: "Not connected" };
    }

    const response = await fetch(`${cadieUrl}/api/spaces/${spaceId}/links`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ link_ids: [linkId] }),
    });

    if (!response.ok) {
      return { success: false, error: `Error ${response.status}` };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: "Network error" };
  }
}

/**
 * Remove a link from a space
 */
export async function removeLinkFromSpace(spaceId: string, linkId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const token = await getApiToken();
    const cadieUrl = await getCadieUrl();

    if (!token || token.length < 32) {
      return { success: false, error: "Not connected" };
    }

    const response = await fetch(`${cadieUrl}/api/spaces/${spaceId}/links`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ link_ids: [linkId] }),
    });

    if (!response.ok) {
      return { success: false, error: `Error ${response.status}` };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: "Network error" };
  }
}
