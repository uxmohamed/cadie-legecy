/**
 * Tests for usePrefetchView hook
 * Covers prefetch delay timing, requestIdleCallback usage, cache key generation,
 * cleanup behavior on unmount, and conditional logic
 */

import { renderHook, waitFor } from '@testing-library/react';
import { usePrefetchView } from '@/features/links/hooks/use-prefetch-view.hook';
import { preload } from 'swr';

// Mock SWR's preload function
jest.mock('swr', () => ({
  preload: jest.fn().mockResolvedValue(undefined),
}));

// =============================================================================
// Test Utilities
// =============================================================================

/**
 * Helper to advance timers and wait for idle callbacks
 */
async function advanceTimersAndWaitForIdle(ms: number) {
  jest.advanceTimersByTime(ms);
  await waitFor(() => {
    // Allow any pending promises to resolve
    return Promise.resolve();
  });
}

// =============================================================================
// Setup and Teardown
// =============================================================================

describe('usePrefetchView', () => {
  let mockRequestIdleCallback: jest.Mock;
  let originalRequestIdleCallback: any;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();

    // Save original requestIdleCallback
    originalRequestIdleCallback = (global as any).requestIdleCallback;

    // Create a mock that executes callbacks immediately
    mockRequestIdleCallback = jest.fn((callback: IdleRequestCallback) => {
      callback({
        didTimeout: false,
        timeRemaining: () => 50,
      } as IdleDeadline);
      return 1;
    });

    // Set up requestIdleCallback mock
    (global as any).requestIdleCallback = mockRequestIdleCallback;
  });

  afterEach(() => {
    jest.useRealTimers();
    // Restore original requestIdleCallback
    (global as any).requestIdleCallback = originalRequestIdleCallback;
  });

  // ===========================================================================
  // Prefetch Delay Timing Tests
  // ===========================================================================

  describe('prefetch delay timing', () => {
    it('should wait 3 seconds before prefetching', async () => {
      const { unmount } = renderHook(() =>
        usePrefetchView('all', 'user-123', true)
      );

      // Should not prefetch immediately
      expect(preload).not.toHaveBeenCalled();

      // Advance time by 2 seconds - still shouldn't prefetch
      await advanceTimersAndWaitForIdle(2000);
      expect(preload).not.toHaveBeenCalled();

      // Advance time by 1 more second (total 3 seconds)
      await advanceTimersAndWaitForIdle(1000);

      // Now it should have prefetched
      await waitFor(() => {
        expect(preload).toHaveBeenCalledTimes(1);
      });

      unmount();
    });

    it('should not prefetch if unmounted before delay completes', async () => {
      const { unmount } = renderHook(() =>
        usePrefetchView('all', 'user-123', true)
      );

      // Advance time by 2 seconds
      await advanceTimersAndWaitForIdle(2000);

      // Unmount before the 3-second delay completes
      unmount();

      // Complete the remaining time
      await advanceTimersAndWaitForIdle(1000);

      // Should not have prefetched
      expect(preload).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // requestIdleCallback Usage Tests
  // ===========================================================================

  describe('requestIdleCallback usage', () => {
    it('should use requestIdleCallback when available', async () => {
      renderHook(() => usePrefetchView('all', 'user-123', true));

      // Fast-forward through the delay
      await advanceTimersAndWaitForIdle(3000);

      // Wait for preload to be called
      await waitFor(() => {
        expect(mockRequestIdleCallback).toHaveBeenCalled();
        expect(preload).toHaveBeenCalled();
      });
    });

    it('should execute prefetch immediately if requestIdleCallback is not available', async () => {
      // Remove requestIdleCallback
      (global as any).requestIdleCallback = undefined;

      renderHook(() => usePrefetchView('all', 'user-123', true));

      // Fast-forward through the delay
      await advanceTimersAndWaitForIdle(3000);

      // Should have called preload without requestIdleCallback
      await waitFor(() => {
        expect(preload).toHaveBeenCalled();
      });
    });

    it('should pass 5 second timeout to requestIdleCallback', async () => {
      renderHook(() => usePrefetchView('all', 'user-123', true));

      // Fast-forward through the delay
      await advanceTimersAndWaitForIdle(3000);

      await waitFor(() => {
        expect(mockRequestIdleCallback).toHaveBeenCalledWith(
          expect.any(Function),
          { timeout: 5000 }
        );
      });
    });
  });

  // ===========================================================================
  // Cache Key Generation Tests
  // ===========================================================================

  describe('cache key generation', () => {
    it('should prefetch trash view when current view is all', async () => {
      renderHook(() => usePrefetchView('all', 'user-123', true));

      await advanceTimersAndWaitForIdle(3000);

      await waitFor(() => {
        expect(preload).toHaveBeenCalledWith(
          '/api/links?is_deleted=true&limit=100&offset=0#user=user-123',
          expect.any(Function)
        );
      });
    });

    it('should prefetch all view when current view is trash', async () => {
      renderHook(() => usePrefetchView('trash', 'user-123', true));

      await advanceTimersAndWaitForIdle(3000);

      await waitFor(() => {
        expect(preload).toHaveBeenCalledWith(
          '/api/links?is_deleted=false&limit=100&offset=0#user=user-123',
          expect.any(Function)
        );
      });
    });

    it('should include userId in cache key', async () => {
      renderHook(() => usePrefetchView('all', 'different-user-id', true));

      await advanceTimersAndWaitForIdle(3000);

      await waitFor(() => {
        expect(preload).toHaveBeenCalledWith(
          '/api/links?is_deleted=true&limit=100&offset=0#user=different-user-id',
          expect.any(Function)
        );
      });
    });
  });

  // ===========================================================================
  // Cleanup Behavior Tests
  // ===========================================================================

  describe('cleanup behavior on unmount', () => {
    it('should clear timeout when unmounted', async () => {
      const { unmount } = renderHook(() =>
        usePrefetchView('all', 'user-123', true)
      );

      // Verify timeout is scheduled
      expect(jest.getTimerCount()).toBeGreaterThan(0);

      // Unmount the hook
      unmount();

      // Fast-forward time
      await advanceTimersAndWaitForIdle(3000);

      // Prefetch should not have been called
      expect(preload).not.toHaveBeenCalled();
    });

    it('should handle multiple mount/unmount cycles', async () => {
      // First mount
      const { unmount: unmount1 } = renderHook(() =>
        usePrefetchView('all', 'user-123', true)
      );

      await advanceTimersAndWaitForIdle(1000);
      unmount1();

      // Second mount
      const { unmount: unmount2 } = renderHook(() =>
        usePrefetchView('all', 'user-123', true)
      );

      await advanceTimersAndWaitForIdle(3000);

      // Should have prefetched once (from the second mount)
      await waitFor(() => {
        expect(preload).toHaveBeenCalledTimes(1);
      });

      unmount2();
    });
  });

  // ===========================================================================
  // Conditional Logic Tests
  // ===========================================================================

  describe('conditional logic for isAuthenticated and userId', () => {
    it('should not prefetch when isAuthenticated is false', async () => {
      renderHook(() => usePrefetchView('all', 'user-123', false));

      await advanceTimersAndWaitForIdle(3000);

      expect(preload).not.toHaveBeenCalled();
    });

    it('should not prefetch when userId is undefined', async () => {
      renderHook(() => usePrefetchView('all', undefined, true));

      await advanceTimersAndWaitForIdle(3000);

      expect(preload).not.toHaveBeenCalled();
    });

    it('should not prefetch when both isAuthenticated is false and userId is undefined', async () => {
      renderHook(() => usePrefetchView('all', undefined, false));

      await advanceTimersAndWaitForIdle(3000);

      expect(preload).not.toHaveBeenCalled();
    });

    it('should prefetch only when both isAuthenticated is true and userId is provided', async () => {
      renderHook(() => usePrefetchView('all', 'user-123', true));

      await advanceTimersAndWaitForIdle(3000);

      await waitFor(() => {
        expect(preload).toHaveBeenCalledTimes(1);
      });
    });
  });

  // ===========================================================================
  // Prefetch Deduplication Tests
  // ===========================================================================

  describe('prefetch deduplication', () => {
    it('should only prefetch trash view once, even if currentView changes to trash and back', async () => {
      const { rerender } = renderHook(
        ({ view }) => usePrefetchView(view, 'user-123', true),
        { initialProps: { view: 'all' as const } }
      );

      // First prefetch after 3 seconds
      await advanceTimersAndWaitForIdle(3000);

      await waitFor(() => {
        expect(preload).toHaveBeenCalledTimes(1);
        expect(preload).toHaveBeenCalledWith(
          '/api/links?is_deleted=true&limit=100&offset=0#user=user-123',
          expect.any(Function)
        );
      });

      // Change to trash view - should try to prefetch "all" view
      rerender({ view: 'trash' as const });
      await advanceTimersAndWaitForIdle(3000);

      await waitFor(() => {
        expect(preload).toHaveBeenCalledTimes(2);
        expect(preload).toHaveBeenCalledWith(
          '/api/links?is_deleted=false&limit=100&offset=0#user=user-123',
          expect.any(Function)
        );
      });

      // Change back to all view - should NOT prefetch trash again
      rerender({ view: 'all' as const });
      await advanceTimersAndWaitForIdle(3000);

      // Should still be 2 calls (no new prefetch)
      expect(preload).toHaveBeenCalledTimes(2);
    });

    it('should track prefetched views per hook instance', async () => {
      // First hook instance
      const { unmount: unmount1 } = renderHook(() =>
        usePrefetchView('all', 'user-123', true)
      );

      await advanceTimersAndWaitForIdle(3000);

      await waitFor(() => {
        expect(preload).toHaveBeenCalledTimes(1);
      });

      unmount1();

      // Reset preload mock for clarity
      (preload as jest.Mock).mockClear();

      // Second hook instance should prefetch again
      const { unmount: unmount2 } = renderHook(() =>
        usePrefetchView('all', 'user-123', true)
      );

      await advanceTimersAndWaitForIdle(3000);

      await waitFor(() => {
        expect(preload).toHaveBeenCalledTimes(1);
      });

      unmount2();
    });
  });

  // ===========================================================================
  // Error Handling Tests
  // ===========================================================================

  describe('error handling', () => {
    it('should silently fail if preload rejects', async () => {
      // Make preload reject
      (preload as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      renderHook(() => usePrefetchView('all', 'user-123', true));

      await advanceTimersAndWaitForIdle(3000);

      // Should have attempted to preload
      await waitFor(() => {
        expect(preload).toHaveBeenCalled();
      });

      // Should not throw error (silent failure)
      // If it threw, the test would fail
    });

    it('should continue normal operation after preload error', async () => {
      // First call fails
      (preload as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { rerender } = renderHook(
        ({ view }) => usePrefetchView(view, 'user-123', true),
        { initialProps: { view: 'all' as const } }
      );

      await advanceTimersAndWaitForIdle(3000);

      // First preload should have been called
      await waitFor(() => {
        expect(preload).toHaveBeenCalledTimes(1);
      });

      // Reset mock to succeed this time
      (preload as jest.Mock).mockResolvedValueOnce(undefined);

      // Change view to trigger another prefetch
      rerender({ view: 'trash' as const });
      await advanceTimersAndWaitForIdle(3000);

      // Second preload should work
      await waitFor(() => {
        expect(preload).toHaveBeenCalledTimes(2);
      });
    });
  });

  // ===========================================================================
  // Integration Tests
  // ===========================================================================

  describe('integration scenarios', () => {
    it('should handle userId change during prefetch delay', async () => {
      const { rerender } = renderHook(
        ({ userId }) => usePrefetchView('all', userId, true),
        { initialProps: { userId: 'user-123' } }
      );

      // Advance time partially
      await advanceTimersAndWaitForIdle(1500);

      // Change userId mid-delay - this cancels the previous timeout and starts a new one
      rerender({ userId: 'user-456' });

      // Need to wait the full 3 seconds from the rerender
      await advanceTimersAndWaitForIdle(3000);

      // Should prefetch with new userId
      await waitFor(() => {
        expect(preload).toHaveBeenCalledWith(
          expect.stringContaining('user=user-456'),
          expect.any(Function)
        );
      });
    });

    it('should handle authentication state change during prefetch delay', async () => {
      const { rerender } = renderHook(
        ({ isAuth }) => usePrefetchView('all', 'user-123', isAuth),
        { initialProps: { isAuth: true } }
      );

      // Advance time partially
      await advanceTimersAndWaitForIdle(1500);

      // User logs out mid-delay
      rerender({ isAuth: false });

      // Complete delay
      await advanceTimersAndWaitForIdle(1500);

      // Should not have prefetched
      expect(preload).not.toHaveBeenCalled();
    });

    it('should respect view changes that happen rapidly', async () => {
      const { rerender } = renderHook(
        ({ view }) => usePrefetchView(view, 'user-123', true),
        { initialProps: { view: 'all' as const } }
      );

      // Change view before delay completes
      await advanceTimersAndWaitForIdle(1000);
      rerender({ view: 'trash' as const });

      await advanceTimersAndWaitForIdle(1000);
      rerender({ view: 'all' as const });

      // Complete the last delay
      await advanceTimersAndWaitForIdle(3000);

      // Should have prefetched based on final view state
      await waitFor(() => {
        expect(preload).toHaveBeenCalledWith(
          '/api/links?is_deleted=true&limit=100&offset=0#user=user-123',
          expect.any(Function)
        );
      });
    });
  });
});
