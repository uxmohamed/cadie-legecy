export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 3,
  delay = 1000
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      
      // If response is ok or client error (4xx), don't retry
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response;
      }
      
      // Server error (5xx), retry
      if (i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
        continue;
      }
      
      return response;
    } catch (error) {
      // Network error, retry
      if (i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
        continue;
      }
      throw error;
    }
  }
  
  throw new Error("Failed to fetch after retries");
}

export function handleApiError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === "string") {
    return error;
  }
  
  return "An unexpected error occurred";
}

