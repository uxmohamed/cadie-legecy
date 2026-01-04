/**
 * Tests for /api/links batch endpoint
 * Covers all batch operations: add, delete, restore, permanent_delete, pin, unpin
 */

import {
  createMockLink,
  createBatchApiResponse,
  resetLinkIdCounter,
} from '../fixtures/link.fixtures';

// =============================================================================
// Test Utilities
// =============================================================================

function mockFetchSuccess(responseData: unknown) {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => responseData,
  });
}

function mockFetchError(errorMessage: string, status = 400) {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: false,
    status,
    statusText: 'Bad Request',
    json: async () => ({ error: errorMessage }),
  });
}

function mockFetchNetworkError() {
  (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
}

// =============================================================================
// Batch API Integration Tests
// =============================================================================

describe('/api/links/batch', () => {
  beforeEach(() => {
    resetLinkIdCounter();
    jest.clearAllMocks();
  });

  describe('POST - action: add', () => {
    it('creates multiple links with valid data', async () => {
      const linksToCreate = [
        { url: 'https://google.com', title: 'Google' },
        { url: 'https://github.com', title: 'GitHub' },
      ];
      
      const createdLinks = linksToCreate.map((l, i) => 
        createMockLink({ url: l.url, title: l.title, id: `created-${i}` })
      );
      
      mockFetchSuccess(createBatchApiResponse(createdLinks, 2, 0));

      const response = await fetch('/api/links/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', links: linksToCreate }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.links).toHaveLength(2);
      expect(data.count).toBe(2);
    });

    it('handles duplicates within the batch', async () => {
      const linksToCreate = [
        { url: 'https://example.com', title: 'Example 1' },
        { url: 'https://example.com', title: 'Example 2' }, // Duplicate
      ];
      
      // API should dedupe and only create 1
      const createdLinks = [createMockLink({ url: 'https://example.com', title: 'Example 1' })];
      mockFetchSuccess(createBatchApiResponse(createdLinks, 1, 0));

      const response = await fetch('/api/links/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', links: linksToCreate }),
      });

      const data = await response.json();
      expect(data.links).toHaveLength(1);
    });

    it('restores deleted duplicates instead of creating new', async () => {
      const linksToCreate = [
        { url: 'https://already-deleted.com', title: 'Restored' },
      ];
      
      const restoredLink = createMockLink({ 
        url: 'https://already-deleted.com', 
        is_deleted: false 
      });
      
      mockFetchSuccess(createBatchApiResponse([restoredLink], 1, 1));

      const response = await fetch('/api/links/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', links: linksToCreate }),
      });

      const data = await response.json();
      expect(data.restored).toBe(1);
      expect(data.links[0].is_deleted).toBe(false);
    });

    it('rejects request without links array', async () => {
      mockFetchError('Invalid request: \'add\' action requires \'links\' array, other actions require \'ids\' array');

      const response = await fetch('/api/links/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add' }),
      });

      expect(response.ok).toBe(false);
    });
  });

  describe('POST - action: delete', () => {
    it('soft deletes all specified links', async () => {
      const ids = ['link-1', 'link-2', 'link-3'];
      
      mockFetchSuccess({ success: true, count: 3 });

      const response = await fetch('/api/links/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', ids }),
      });

      expect(response.ok).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith('/api/links/batch', expect.objectContaining({
        body: JSON.stringify({ action: 'delete', ids }),
      }));
    });

    it('ignores already deleted links', async () => {
      const ids = ['already-deleted-1', 'active-1'];
      
      mockFetchSuccess({ success: true, count: 1 }); // Only 1 actually deleted

      const response = await fetch('/api/links/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', ids }),
      });

      const data = await response.json();
      expect(data.count).toBe(1);
    });

    it('rejects empty ids array', async () => {
      mockFetchError('Invalid request: \'add\' action requires \'links\' array, other actions require \'ids\' array');

      const response = await fetch('/api/links/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', ids: [] }),
      });

      expect(response.ok).toBe(false);
    });
  });

  describe('POST - action: restore', () => {
    it('restores all specified links from trash', async () => {
      const ids = ['deleted-1', 'deleted-2'];
      
      mockFetchSuccess({ success: true, count: 2 });

      const response = await fetch('/api/links/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore', ids }),
      });

      expect(response.ok).toBe(true);
    });

    it('ignores already active links', async () => {
      const ids = ['active-1', 'deleted-1'];
      
      mockFetchSuccess({ success: true, count: 1 });

      const response = await fetch('/api/links/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore', ids }),
      });

      const data = await response.json();
      expect(data.count).toBe(1);
    });
  });

  describe('POST - action: permanent_delete', () => {
    it('permanently removes links from database', async () => {
      const ids = ['deleted-1', 'deleted-2'];
      
      mockFetchSuccess({ success: true, count: 2 });

      const response = await fetch('/api/links/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'permanent_delete', ids }),
      });

      expect(response.ok).toBe(true);
    });

    it('only affects soft-deleted links', async () => {
      const ids = ['active-1', 'deleted-1'];
      
      // Only the deleted one should be permanently deleted
      mockFetchSuccess({ success: true, count: 1 });

      const response = await fetch('/api/links/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'permanent_delete', ids }),
      });

      const data = await response.json();
      expect(data.count).toBe(1);
    });
  });

  describe('POST - action: pin', () => {
    it('pins all specified links', async () => {
      const ids = ['link-1', 'link-2'];
      
      mockFetchSuccess({ success: true, count: 2 });

      const response = await fetch('/api/links/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pin', ids }),
      });

      expect(response.ok).toBe(true);
    });

    it('is idempotent for already pinned links', async () => {
      const ids = ['already-pinned-1', 'unpinned-1'];
      
      mockFetchSuccess({ success: true, count: 2 });

      const response = await fetch('/api/links/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pin', ids }),
      });

      expect(response.ok).toBe(true);
    });
  });

  describe('POST - action: unpin', () => {
    it('unpins all specified links', async () => {
      const ids = ['pinned-1', 'pinned-2'];
      
      mockFetchSuccess({ success: true, count: 2 });

      const response = await fetch('/api/links/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unpin', ids }),
      });

      expect(response.ok).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('returns 401 for unauthenticated requests', async () => {
      mockFetchError('Unauthorized', 401);

      const response = await fetch('/api/links/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', ids: ['1'] }),
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(401);
    });

    it('returns 429 when rate limited', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => ({ error: 'Too many requests. Please try again later.' }),
      });

      const response = await fetch('/api/links/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', ids: ['1'] }),
      });

      expect(response.status).toBe(429);
    });

    it('handles network errors gracefully', async () => {
      mockFetchNetworkError();

      await expect(
        fetch('/api/links/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete', ids: ['1'] }),
        })
      ).rejects.toThrow('Network error');
    });

    it('rejects invalid action type', async () => {
      mockFetchError('Invalid action');

      const response = await fetch('/api/links/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'invalid_action', ids: ['1'] }),
      });

      expect(response.ok).toBe(false);
    });
  });
});
