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
  retryable?: boolean;
  statusCode?: number;
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

const REQUEST_TIMEOUT_MS = 12000;
const RETRYABLE_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504]);

function isRetryableStatus(status: number): boolean {
  return RETRYABLE_STATUS_CODES.has(status);
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs: number = REQUEST_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function parseApiError(response: Response): Promise<string> {
  try {
    const errorData = await response.json();
    return String(
      errorData?.error?.message ||
      errorData?.error ||
      errorData?.details?.[0]?.message ||
      response.statusText ||
      `Error ${response.status}`
    );
  } catch {
    return response.statusText || `Error ${response.status}`;
  }
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

    const response = await fetchWithTimeout(`${cadieUrl}/api/links`, {
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
          authFailed: true,
          retryable: false,
          statusCode: response.status,
        };
      }

      const errorMsg = await parseApiError(response);
      return {
        success: false,
        error: errorMsg,
        retryable: isRetryableStatus(response.status),
        statusCode: response.status,
      };
    }

    const data = await response.json();
    return {
      success: true,
      duplicate: data.duplicate === true,
      linkId: data.link?.id
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return {
        success: false,
        error: "Request timed out",
        retryable: true,
      };
    }

    return { success: false, error: "Network error", retryable: true };
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

    const response = await fetchWithTimeout(`${cadieUrl}/api/spaces`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorMsg = await parseApiError(response);
      return { success: false, error: errorMsg };
    }

    const data = await response.json();
    return { success: true, spaces: data.spaces || [] };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return { success: false, error: "Request timed out" };
    }
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

    const response = await fetchWithTimeout(`${cadieUrl}/api/spaces/${spaceId}/links`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ link_ids: [linkId] }),
    });

    if (!response.ok) {
      const errorMsg = await parseApiError(response);
      return { success: false, error: errorMsg };
    }

    return { success: true };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return { success: false, error: "Request timed out" };
    }
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

    const response = await fetchWithTimeout(`${cadieUrl}/api/spaces/${spaceId}/links`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ link_ids: [linkId] }),
    });

    if (!response.ok) {
      const errorMsg = await parseApiError(response);
      return { success: false, error: errorMsg };
    }

    return { success: true };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return { success: false, error: "Request timed out" };
    }
    return { success: false, error: "Network error" };
  }
}

/**
 * Fetch all spaces that a link belongs to
 */
export interface LinkSpacesResponse {
  success: boolean;
  error?: string;
  space_ids?: string[];
}

export async function fetchLinkSpaces(linkId: string): Promise<LinkSpacesResponse> {
  try {
    const token = await getApiToken();
    const cadieUrl = await getCadieUrl();

    if (!token || token.length < 32) {
      return { success: false, error: "Not connected" };
    }

    const response = await fetchWithTimeout(`${cadieUrl}/api/links/${linkId}/spaces`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorMsg = await parseApiError(response);
      return { success: false, error: errorMsg };
    }

    const data = await response.json();
    return { success: true, space_ids: data.space_ids || [] };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return { success: false, error: "Request timed out" };
    }
    return { success: false, error: "Network error" };
  }
}
