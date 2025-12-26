/**
 * Cadie API client for Chrome extension
 */

import { getApiToken, getCadieUrl } from "./storage";

export interface SaveLinkRequest {
  url: string;
  title: string;
  content_type?: "url" | "text" | "color";
  category_id?: string;
  color_value?: string;
  favicon_url?: string;
  og_image_url?: string;
  description?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  duplicate?: boolean;
}

/**
 * Save a link to Cadie
 */
export async function saveLink(request: SaveLinkRequest): Promise<ApiResponse> {
  try {
    const token = await getApiToken();
    if (!token) {
      return {
        success: false,
        error: "No API token configured. Please set up your token in extension settings.",
      };
    }

    const cadieUrl = await getCadieUrl();
    const response = await fetch(`${cadieUrl}/api/links`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    
    return {
      success: true,
      data,
      duplicate: data.duplicate === true,
    };
  } catch (error) {
    console.error("API Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

/**
 * Test API connection
 */
export async function testConnection(): Promise<ApiResponse> {
  try {
    const token = await getApiToken();
    if (!token) {
      return {
        success: false,
        error: "No API token provided",
      };
    }

    const cadieUrl = await getCadieUrl();
    const response = await fetch(`${cadieUrl}/api/links`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return {
          success: false,
          error: "Invalid API token",
        };
      }
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    return {
      success: true,
      data: { message: "Connection successful" },
    };
  } catch (error) {
    console.error("Connection test error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

