import { log } from "@/lib/logger";

/**
 * Options for the retry utility
 */
export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Base delay in milliseconds for exponential backoff (default: 100) */
  baseDelayMs?: number;
  /** Custom function to determine if an error should trigger a retry */
  shouldRetry?: (error: unknown) => boolean;
  /** Operation name for logging */
  operationName?: string;
}

/**
 * Default retry predicate - retries on network/transient errors only
 */
function defaultShouldRetry(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    // Retry on network errors, timeouts, and connection issues
    return (
      message.includes("network") ||
      message.includes("timeout") ||
      message.includes("econnreset") ||
      message.includes("econnrefused") ||
      message.includes("socket") ||
      message.includes("fetch failed")
    );
  }
  return false;
}

/**
 * Executes a function with retry logic and exponential backoff.
 * 
 * @param fn - The async function to execute
 * @param options - Retry configuration options
 * @returns The result of the function
 * @throws The last error if all retries are exhausted
 * 
 * @example
 * ```typescript
 * const result = await withRetry(
 *   () => supabase.from("links").update({ is_pinned: true }).eq("id", id),
 *   { operationName: "pinLink", maxRetries: 3 }
 * );
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelayMs = 100,
    shouldRetry = defaultShouldRetry,
    operationName = "operation",
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if this is the last attempt or error is not retryable
      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error;
      }

      // Calculate delay with exponential backoff: 100ms, 200ms, 400ms, ...
      const delay = baseDelayMs * Math.pow(2, attempt);
      
      log.warn(`[Retry] ${operationName} failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms`, {
        error: error instanceof Error ? error.message : String(error),
        attempt: attempt + 1,
        maxRetries: maxRetries + 1,
        nextDelayMs: delay,
      });

      await sleep(delay);
    }
  }

  // This should never be reached due to the throw in the loop, but TypeScript needs it
  throw lastError;
}

/**
 * Sleep utility for async delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry predicate for Supabase operations
 * Retries on transient DB errors but not on constraint violations or auth errors
 */
export function supabaseRetryPredicate(error: unknown): boolean {
  // First check default network errors
  if (defaultShouldRetry(error)) return true;

  // Check for Supabase-specific transient errors
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code: string }).code;
    // Retry on connection/timeout errors, not on constraint violations
    return (
      code === "PGRST301" || // Connection error
      code === "PGRST302" || // Timeout
      code === "57P01" ||    // Admin shutdown
      code === "57P02" ||    // Crash shutdown
      code === "57P03"       // Cannot connect now
    );
  }

  return false;
}
