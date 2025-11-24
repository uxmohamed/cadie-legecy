/**
 * Shared API client utilities
 * Provides consistent error handling and request/response formatting
 */

export class ApiError extends Error {
    constructor(
        message: string,
        public status: number,
        public code?: string
    ) {
        super(message);
        this.name = "ApiError";
    }
}

/**
 * Generic API client for making requests
 */
export class ApiClient {
    /**
     * Make a GET request
     */
    async get<T>(url: string): Promise<T> {
        const response = await fetch(url);
        return this.handleResponse<T>(response);
    }

    /**
     * Make a POST request
     */
    async post<T>(url: string, data: unknown): Promise<T> {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        return this.handleResponse<T>(response);
    }

    /**
     * Make a PUT request
     */
    async put<T>(url: string, data: unknown): Promise<T> {
        const response = await fetch(url, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        return this.handleResponse<T>(response);
    }

    /**
     * Make a DELETE request
     */
    async delete<T>(url: string): Promise<T> {
        const response = await fetch(url, {
            method: "DELETE",
        });
        return this.handleResponse<T>(response);
    }

    /**
     * Handle API response and errors
     */
    private async handleResponse<T>(response: Response): Promise<T> {
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new ApiError(
                error.error || "Request failed",
                response.status,
                error.code
            );
        }

        return response.json();
    }
}

/**
 * Singleton API client instance
 */
export const apiClient = new ApiClient();
