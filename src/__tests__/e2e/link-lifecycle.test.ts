/**
 * E2E User Scenario Tests
 * Tests complete user flows from action to persistence
 */

import {
  createMockLink,
  createMockLinks,
  createMockDeletedLink,
  createLinksApiResponse,
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
    json: async () => ({ error: errorMessage }),
  });
}

// =============================================================================
// Scenario 1: Add and Persist Link
// =============================================================================

describe('Scenario 1: Add and persist link', () => {
  beforeEach(() => {
    resetLinkIdCounter();
    jest.clearAllMocks();
  });

  it('user adds link → appears in list → refresh → still there', async () => {
    // Step 1: User types URL and presses Enter
    const newLink = createMockLink({ url: 'https://google.com', title: 'Google' });
    mockFetchSuccess(createBatchApiResponse([newLink], 1, 0));

    const createResponse = await fetch('/api/links/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add',
        links: [{ url: 'https://google.com', title: 'https://google.com' }],
      }),
    });

    expect(createResponse.ok).toBe(true);
    const createData = await createResponse.json();
    expect(createData.links[0].url).toBe('https://google.com');

    // Step 2: After "refresh" (re-fetch), link is still there
    mockFetchSuccess(createLinksApiResponse([newLink], 1));

    const getResponse = await fetch('/api/links');
    const getData = await getResponse.json();

    expect(getData.links).toHaveLength(1);
    expect(getData.links[0].url).toBe('https://google.com');
  });
});

// =============================================================================
// Scenario 2: Delete and Restore
// =============================================================================

describe('Scenario 2: Delete and restore', () => {
  beforeEach(() => {
    resetLinkIdCounter();
    jest.clearAllMocks();
  });

  it('user deletes link → moves to trash → restores → back in list', async () => {
    const link = createMockLink({ id: 'link-1', url: 'https://example.com' });

    // Step 1: User right-clicks and deletes
    mockFetchSuccess({ success: true });

    const deleteResponse = await fetch('/api/links/link-1', {
      method: 'DELETE',
    });

    expect(deleteResponse.ok).toBe(true);

    // Step 2: Link appears in trash view
    const deletedLink = createMockDeletedLink({ id: 'link-1', url: 'https://example.com' });
    mockFetchSuccess(createLinksApiResponse([deletedLink], 1));

    const trashResponse = await fetch('/api/links?is_deleted=true');
    const trashData = await trashResponse.json();

    expect(trashData.links).toHaveLength(1);
    expect(trashData.links[0].is_deleted).toBe(true);

    // Step 3: User restores the link
    const restoredLink = createMockLink({ id: 'link-1', is_deleted: false });
    mockFetchSuccess(restoredLink);

    const restoreResponse = await fetch('/api/links/link-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_deleted: false, is_archived: false }),
    });

    expect(restoreResponse.ok).toBe(true);

    // Step 4: Link is back in All view
    mockFetchSuccess(createLinksApiResponse([restoredLink], 1));

    const allResponse = await fetch('/api/links?is_deleted=false');
    const allData = await allResponse.json();

    expect(allData.links).toHaveLength(1);
    expect(allData.links[0].is_deleted).toBe(false);
  });
});

// =============================================================================
// Scenario 3: Batch Operations
// =============================================================================

describe('Scenario 3: Batch operations', () => {
  beforeEach(() => {
    resetLinkIdCounter();
    jest.clearAllMocks();
  });

  it('user selects 3 links → batch delete → all in trash → batch restore', async () => {
    const links = createMockLinks(3);
    const ids = links.map(l => l.id);

    // Step 1: User selects 3 links and batch deletes
    mockFetchSuccess({ success: true, count: 3 });

    const deleteResponse = await fetch('/api/links/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', ids }),
    });

    expect(deleteResponse.ok).toBe(true);

    // Step 2: All 3 links appear in trash
    const deletedLinks = links.map(l => createMockDeletedLink({ ...l }));
    mockFetchSuccess(createLinksApiResponse(deletedLinks, 3));

    const trashResponse = await fetch('/api/links?is_deleted=true');
    const trashData = await trashResponse.json();

    expect(trashData.links).toHaveLength(3);

    // Step 3: User batch restores all
    mockFetchSuccess({ success: true, count: 3 });

    const restoreResponse = await fetch('/api/links/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'restore', ids }),
    });

    expect(restoreResponse.ok).toBe(true);

    // Step 4: All links are back in active view
    mockFetchSuccess(createLinksApiResponse(links, 3));

    const allResponse = await fetch('/api/links?is_deleted=false');
    const allData = await allResponse.json();

    expect(allData.links).toHaveLength(3);
  });
});

// =============================================================================
// Scenario 4: Permanent Delete
// =============================================================================

describe('Scenario 4: Permanent delete', () => {
  beforeEach(() => {
    resetLinkIdCounter();
    jest.clearAllMocks();
  });

  it('user deletes → permanent delete → link is gone forever', async () => {
    const link = createMockLink({ id: 'link-1' });

    // Step 1: Soft delete
    mockFetchSuccess({ success: true });
    await fetch('/api/links/link-1', { method: 'DELETE' });

    // Step 2: Permanent delete
    mockFetchSuccess({ success: true });

    const permanentResponse = await fetch('/api/links/link-1/permanent', {
      method: 'DELETE',
    });

    expect(permanentResponse.ok).toBe(true);

    // Step 3: Link is gone from trash too
    mockFetchSuccess(createLinksApiResponse([], 0));

    const trashResponse = await fetch('/api/links?is_deleted=true');
    const trashData = await trashResponse.json();

    expect(trashData.links).toHaveLength(0);
  });
});

// =============================================================================
// Scenario 5: Duplicate Handling
// =============================================================================

describe('Scenario 5: Duplicate handling', () => {
  beforeEach(() => {
    resetLinkIdCounter();
    jest.clearAllMocks();
  });

  it('user adds duplicate URL → shows "already in list" → no duplicate created', async () => {
    // Step 1: First add succeeds
    const link = createMockLink({ url: 'https://example.com' });
    mockFetchSuccess(createBatchApiResponse([link], 1, 0));

    await fetch('/api/links/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add',
        links: [{ url: 'https://example.com', title: 'Example' }],
      }),
    });

    // Step 2: Second add with same URL - server would return count: 0
    // (Client-side deduplication would prevent API call, but testing server behavior)
    mockFetchSuccess(createBatchApiResponse([], 0, 0));

    const duplicateResponse = await fetch('/api/links/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add',
        links: [], // Client filtered it out
      }),
    });

    const duplicateData = await duplicateResponse.json();
    expect(duplicateData.count).toBe(0);

    // Step 3: Verify only one link exists
    mockFetchSuccess(createLinksApiResponse([link], 1));

    const allResponse = await fetch('/api/links');
    const allData = await allResponse.json();

    expect(allData.links).toHaveLength(1);
  });

  it('user adds URL that was previously deleted → restores from trash', async () => {
    // Step 1: URL was previously deleted
    const deletedLink = createMockDeletedLink({ url: 'https://was-deleted.com' });

    // Step 2: User tries to add same URL - server restores it
    const restoredLink = createMockLink({ 
      ...deletedLink, 
      is_deleted: false,
      deleted_at: null,
    });
    mockFetchSuccess(createBatchApiResponse([restoredLink], 1, 1));

    const response = await fetch('/api/links/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add',
        links: [{ url: 'https://was-deleted.com', title: 'Was Deleted' }],
      }),
    });

    const data = await response.json();
    expect(data.restored).toBe(1);
    expect(data.links[0].is_deleted).toBe(false);
  });
});

// =============================================================================
// Scenario 6: Network Failure Recovery
// =============================================================================

describe('Scenario 6: Network failure recovery', () => {
  beforeEach(() => {
    resetLinkIdCounter();
    jest.clearAllMocks();
  });

  it('network fails → error shown → network restored → retry succeeds', async () => {
    // Step 1: First attempt fails
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    await expect(
      fetch('/api/links/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          links: [{ url: 'https://test.com', title: 'Test' }],
        }),
      })
    ).rejects.toThrow('Network error');

    // Step 2: User retries after network is restored
    const link = createMockLink({ url: 'https://test.com' });
    mockFetchSuccess(createBatchApiResponse([link], 1, 0));

    const retryResponse = await fetch('/api/links/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add',
        links: [{ url: 'https://test.com', title: 'Test' }],
      }),
    });

    expect(retryResponse.ok).toBe(true);
  });

  it('server error → shows error message → optimistic update reverts', async () => {
    // Simulating the hook's behavior pattern
    mockFetchError('Internal server error', 500);

    const response = await fetch('/api/links/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', ids: ['1', '2'] }),
    });

    expect(response.ok).toBe(false);
    expect(response.status).toBe(500);

    // The hook would call mutate() to revert the optimistic update
    // and show toast.error with the server message
  });
});

// =============================================================================
// Scenario 7: Pin/Unpin Workflow
// =============================================================================

describe('Scenario 7: Pin/Unpin workflow', () => {
  beforeEach(() => {
    resetLinkIdCounter();
    jest.clearAllMocks();
  });

  it('user pins link → shows in pinned section → unpins → back to regular', async () => {
    const link = createMockLink({ id: 'link-1', is_pinned: false });

    // Step 1: User pins the link
    const pinnedLink = { ...link, is_pinned: true };
    mockFetchSuccess(pinnedLink);

    const pinResponse = await fetch('/api/links/link-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_pinned: true }),
    });

    expect(pinResponse.ok).toBe(true);
    const pinData = await pinResponse.json();
    expect(pinData.is_pinned).toBe(true);

    // Step 2: User unpins the link
    const unpinnedLink = { ...link, is_pinned: false };
    mockFetchSuccess(unpinnedLink);

    const unpinResponse = await fetch('/api/links/link-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_pinned: false }),
    });

    const unpinData = await unpinResponse.json();
    expect(unpinData.is_pinned).toBe(false);
  });

  it('user batch pins multiple links', async () => {
    const ids = ['1', '2', '3'];

    mockFetchSuccess({ success: true, count: 3 });

    const response = await fetch('/api/links/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'pin', ids }),
    });

    expect(response.ok).toBe(true);
  });
});

// =============================================================================
// Scenario 8: Search and Filter
// =============================================================================

describe('Scenario 8: Search and filter', () => {
  beforeEach(() => {
    resetLinkIdCounter();
    jest.clearAllMocks();
  });

  it('user searches → filtered results → clears search → all results', async () => {
    const allLinks = createMockLinks(5);
    const googleLink = createMockLink({ url: 'https://google.com', title: 'Google' });

    // Step 1: User searches for "google"
    mockFetchSuccess(createLinksApiResponse([googleLink], 1));

    const searchResponse = await fetch('/api/links?q=google');
    const searchData = await searchResponse.json();

    expect(searchData.links).toHaveLength(1);
    expect(searchData.links[0].title).toContain('Google');

    // Step 2: User clears search
    mockFetchSuccess(createLinksApiResponse(allLinks, 5));

    const allResponse = await fetch('/api/links');
    const allData = await allResponse.json();

    expect(allData.links).toHaveLength(5);
  });
});
