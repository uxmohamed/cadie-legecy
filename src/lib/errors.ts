/**
 * Structured error handling for Cadie
 * Provides typed error codes and a structured AppError class
 */

export enum ErrorCode {
  // Authentication errors
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",

  // Resource errors
  NOT_FOUND = "NOT_FOUND",
  ALREADY_EXISTS = "ALREADY_EXISTS",

  // Validation errors
  INVALID_INPUT = "INVALID_INPUT",
  INVALID_URL = "INVALID_URL",

  // Database errors
  DATABASE_ERROR = "DATABASE_ERROR",
  QUERY_FAILED = "QUERY_FAILED",

  // External service errors
  METADATA_FETCH_FAILED = "METADATA_FETCH_FAILED",
  NETWORK_ERROR = "NETWORK_ERROR",

  // General errors
  INTERNAL_ERROR = "INTERNAL_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AppError";
    Object.setPrototypeOf(this, AppError.prototype);
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
    };
  }

  /**
   * Get a user-friendly message for toast notifications
   */
  getUserMessage(): string {
    switch (this.code) {
      case ErrorCode.UNAUTHORIZED:
        return "Please sign in to continue";
      case ErrorCode.FORBIDDEN:
        return "You don't have permission to do that";
      case ErrorCode.NOT_FOUND:
        return "Item not found";
      case ErrorCode.ALREADY_EXISTS:
        return "This item already exists";
      case ErrorCode.INVALID_INPUT:
        return "Please check your input and try again";
      case ErrorCode.INVALID_URL:
        return "Please enter a valid URL";
      case ErrorCode.DATABASE_ERROR:
      case ErrorCode.QUERY_FAILED:
        return "Database error. Please try again";
      case ErrorCode.METADATA_FETCH_FAILED:
        return "Couldn't fetch page details. Link saved anyway";
      case ErrorCode.NETWORK_ERROR:
        return "Network error. Please check your connection";
      case ErrorCode.INTERNAL_ERROR:
      case ErrorCode.UNKNOWN_ERROR:
      default:
        return "Something went wrong. Please try again";
    }
  }
}

/**
 * Helper to check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Helper to convert unknown errors to AppError
 */
export function toAppError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(
      ErrorCode.UNKNOWN_ERROR,
      error.message,
      500,
      { originalError: error.name }
    );
  }

  return new AppError(
    ErrorCode.UNKNOWN_ERROR,
    "An unknown error occurred",
    500
  );
}
