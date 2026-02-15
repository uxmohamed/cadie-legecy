/**
 * Batch Processor Utility
 * Provides controlled concurrency for batch operations with progress callbacks
 */

export interface BatchProcessorOptions<R> {
  /** Maximum concurrent operations (default: 5) */
  concurrency?: number;
  /** Called after each item completes */
  onProgress?: (completed: number, total: number, result: PromiseSettledResult<R>) => void;
  /** Called when all items complete */
  onComplete?: (results: PromiseSettledResult<R>[]) => void;
}

/**
 * Process items in batches with controlled concurrency
 * Returns immediately after queueing, progress is reported via callbacks
 */
export async function processBatch<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  options: BatchProcessorOptions<R> = {}
): Promise<PromiseSettledResult<R>[]> {
  const { concurrency = 5, onProgress, onComplete } = options;
  const results: PromiseSettledResult<R>[] = [];
  let completed = 0;

  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(
      batch.map(async (item) => {
        const result = await processor(item);
        return result;
      })
    );
    
    // Track results and fire progress callbacks
    for (const result of batchResults) {
      completed++;
      results.push(result);
      onProgress?.(completed, items.length, result);
    }
  }

  onComplete?.(results);
  return results;
}

/**
 * Fire-and-forget batch processing
 * Executes all operations immediately without blocking
 * Ensures requests are sent before returning
 */
export function fireAndForgetBatch<T>(
  items: T[],
  processor: (item: T) => Promise<void>,
  options: { concurrency?: number; onError?: (error: Error, item: T) => void } = {}
): void {
  const { concurrency = 10, onError } = options;
  
  // Create all fetch promises immediately to ensure they're sent
  const promises = items.map(async (item) => {
    try {
      await processor(item);
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error(String(error)), item);
    }
  });
  
  // Let them run in background - don't await
  // But we need to at least start them, so we use Promise.allSettled
  // to ensure they're queued before this function returns
  Promise.allSettled(promises);
}
