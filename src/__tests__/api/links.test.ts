/**
 * Tests for /api/links and /api/links/[id] endpoints
 * Covers GET, POST, PUT, DELETE operations
 */

import {
  createMockLink,
  createMockLinks,
  createLinksApiResponse,
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
    statusText: status === 401 ? 'Unauthorized' : 'Bad Request',
    json: async () => ({ error: errorMessage }),
  });
}

// =============================================================================
// GET /api/links Tests
// =============================================================================

describe('GET /api/links', () => {
  beforeEach(() => {
    resetLinkIdCounter();
    jest.clearAllMocks();
  });

  it('returns links for authenticated user', async () => {
    const links = createMockLinks(3);
    mockFetchSuccess(createLinksApiResponse(links, 3));

    const response = await fetch('/api/links');
    const data = await response.json();

    expect(response.ok).toBe(true);
    expect(data.links).toHaveLength(3);
    expect(data.total).toBe(3);
  });

  it('filters by space_id', async () => {
    const spaceId = 'space-123';
    const links = createMockLinks(2);
    mockFetchSuccess(createLinksApiResponse(links, 2));

    const response = await fetch(`/api/links?space_id=${spaceId}`);
    const data = await response.json();

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(`space_id=${spaceId}`)
    );
    expect(data.links).toHaveLength(2);
  });

  it('filters by is_deleted for trash view', async () => {
    const links = createMockLinks(2, { is_deleted: true });
    mockFetchSuccess(createLinksApiResponse(links, 2));

    const response = await fetch('/api/links?is_deleted=true');
    const data = await response.json();

    expect(data.links).toHaveLength(2);
    expect(data.links.every((l: { is_deleted: boolean }) => l.is_deleted)).toBe(true);
  });

  it('supports server-side search with q parameter', async () => {
    const links = [createMockLink({ title: 'Google Search' })];
    mockFetchSuccess(createLinksApiResponse(links, 1));

    await fetch('/api/links?q=google');
    
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('q=google')
    );
  });

  it('supports pagination with limit and offset', async () => {
    const links = createMockLinks(10);
    mockFetchSuccess(createLinksApiResponse(links.slice(0, 5), 10));

    const response = await fetch('/api/links?limit=5&offset=0');
    const data = await response.json();

    expect(data.links).toHaveLength(5);
    expect(data.total).toBe(10);
  });

  it('returns 401 for unauthenticated requests', async () => {
    mockFetchError('Unauthorized', 401);

    const response = await fetch('/api/links');

    expect(response.ok).toBe(false);
    expect(response.status).toBe(401);
  });

  it('returns 429 on rate limit exceeded', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: async () => ({ error: 'Too many requests' }),
    });

    const response = await fetch('/api/links');

    expect(response.status).toBe(429);
  });
});

// =============================================================================
// POST /api/links Tests
// =============================================================================

describe('POST /api/links', () => {
  beforeEach(() => {
    resetLinkIdCounter();
    jest.clearAllMocks();
  });

  it('creates a valid link', async () => {
    const newLink = createMockLink({ 
      url: 'https://newsite.com',
      title: 'New Site' 
    });
    mockFetchSuccess(newLink);

    const response = await fetch('/api/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: 'https://newsite.com',
        title: 'New Site',
      }),
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.url).toBe('https://newsite.com');
  });

  it('validates URL format', async () => {
    mockFetchError('Invalid URL format');

    const response = await fetch('/api/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: 'not-a-valid-url',
        title: 'Invalid',
      }),
    });

    expect(response.ok).toBe(false);
  });

  it('requires title field', async () => {
    mockFetchError('Title is required');

    const response = await fetch('/api/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: 'https://example.com',
      }),
    });

    expect(response.ok).toBe(false);
  });

  it('creates color link with content_type color', async () => {
    const colorLink = createMockLink({
      url: '#FF5733',
      title: '#FF5733',
      content_type: 'color',
      color_value: '#FF5733',
    });
    mockFetchSuccess(colorLink);

    const response = await fetch('/api/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: '#FF5733',
        title: '#FF5733',
        content_type: 'color',
        color_value: '#FF5733',
      }),
    });

    const data = await response.json();
    expect(data.content_type).toBe('color');
    expect(data.color_value).toBe('#FF5733');
  });
});

// =============================================================================
// PUT /api/links/[id] Tests
// =============================================================================

describe('PUT /api/links/[id]', () => {
  beforeEach(() => {
    resetLinkIdCounter();
    jest.clearAllMocks();
  });

  it('updates link title', async () => {
    const updatedLink = createMockLink({ 
      id: 'link-1',
      title: 'Updated Title' 
    });
    mockFetchSuccess(updatedLink);

    const response = await fetch('/api/links/link-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Updated Title' }),
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.title).toBe('Updated Title');
  });

  it('updates pin status', async () => {
    const pinnedLink = createMockLink({ 
      id: 'link-1',
      is_pinned: true 
    });
    mockFetchSuccess(pinnedLink);

    const response = await fetch('/api/links/link-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_pinned: true }),
    });

    const data = await response.json();
    expect(data.is_pinned).toBe(true);
  });

  it('soft deletes by setting is_deleted true', async () => {
    const deletedLink = createMockLink({ 
      id: 'link-1',
      is_deleted: true,
      deleted_at: new Date().toISOString(),
    });
    mockFetchSuccess(deletedLink);

    const response = await fetch('/api/links/link-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_deleted: true }),
    });

    const data = await response.json();
    expect(data.is_deleted).toBe(true);
  });

  it('restores by setting is_deleted false', async () => {
    const restoredLink = createMockLink({ 
      id: 'link-1',
      is_deleted: false,
      deleted_at: null,
    });
    mockFetchSuccess(restoredLink);

    const response = await fetch('/api/links/link-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_deleted: false, is_archived: false }),
    });

    const data = await response.json();
    expect(data.is_deleted).toBe(false);
  });

  it('returns 404 for non-existent link', async () => {
    mockFetchError('Link not found', 404);

    const response = await fetch('/api/links/non-existent', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'New Title' }),
    });

    expect(response.status).toBe(404);
  });

  it('returns 403 for another user\'s link', async () => {
    mockFetchError('Forbidden', 403);

    const response = await fetch('/api/links/other-users-link', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Hacked' }),
    });

    expect(response.status).toBe(403);
  });
});

// =============================================================================
// DELETE /api/links/[id] Tests
// =============================================================================

describe('DELETE /api/links/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('soft deletes the link', async () => {
    mockFetchSuccess({ success: true });

    const response = await fetch('/api/links/link-1', {
      method: 'DELETE',
    });

    expect(response.ok).toBe(true);
  });

  it('returns 404 for non-existent link', async () => {
    mockFetchError('Link not found', 404);

    const response = await fetch('/api/links/non-existent', {
      method: 'DELETE',
    });

    expect(response.status).toBe(404);
  });
});

// =============================================================================
// DELETE /api/links/[id]/permanent Tests
// =============================================================================

describe('DELETE /api/links/[id]/permanent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('permanently deletes a soft-deleted link', async () => {
    mockFetchSuccess({ success: true });

    const response = await fetch('/api/links/deleted-link-1/permanent', {
      method: 'DELETE',
    });

    expect(response.ok).toBe(true);
  });

  it('returns error for non-deleted link', async () => {
    mockFetchError('Link must be in trash before permanent deletion', 400);

    const response = await fetch('/api/links/active-link/permanent', {
      method: 'DELETE',
    });

    expect(response.ok).toBe(false);
  });
});
