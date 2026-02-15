/**
 * Tests for link.schemas.ts
 * Covers Zod validation schemas for link operations
 */

import {
  createLinkSchema,
  updateLinkSchema,
  batchActionSchema,
} from '@/lib/validation/link.schemas';

// =============================================================================
// createLinkSchema Tests
// =============================================================================

describe('createLinkSchema', () => {
  describe('valid URLs', () => {
    it('accepts valid https URL', () => {
      const result = createLinkSchema.safeParse({
        url: 'https://example.com',
        title: 'Example',
      });
      expect(result.success).toBe(true);
    });

    it('accepts valid http URL', () => {
      const result = createLinkSchema.safeParse({
        url: 'http://example.com',
        title: 'Example',
      });
      expect(result.success).toBe(true);
    });

    it('accepts URL with path', () => {
      const result = createLinkSchema.safeParse({
        url: 'https://example.com/path/to/page',
        title: 'Example',
      });
      expect(result.success).toBe(true);
    });

    it('accepts URL with query string', () => {
      const result = createLinkSchema.safeParse({
        url: 'https://example.com?query=test',
        title: 'Example',
      });
      expect(result.success).toBe(true);
    });

    it('accepts URL with port', () => {
      const result = createLinkSchema.safeParse({
        url: 'https://example.com:8080',
        title: 'Example',
      });
      expect(result.success).toBe(true);
    });

    it('accepts URL without title (optional)', () => {
      const result = createLinkSchema.safeParse({
        url: 'https://example.com',
      });
      expect(result.success).toBe(true);
    });

    it('accepts localhost URLs', () => {
      const result = createLinkSchema.safeParse({
        url: 'http://localhost:3000',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('invalid URLs', () => {
    it('rejects URL without protocol', () => {
      const result = createLinkSchema.safeParse({
        url: 'example.com',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid URL format', () => {
      const result = createLinkSchema.safeParse({
        url: 'not-a-valid-url',
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty URL', () => {
      const result = createLinkSchema.safeParse({
        url: '',
      });
      expect(result.success).toBe(false);
    });

    it('rejects URL exceeding max length', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(2000);
      const result = createLinkSchema.safeParse({
        url: longUrl,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('valid colors', () => {
    it('accepts hex color with hash', () => {
      const result = createLinkSchema.safeParse({
        url: '#FF5733',
        content_type: 'color',
      });
      expect(result.success).toBe(true);
    });

    it('accepts 3-digit hex color', () => {
      const result = createLinkSchema.safeParse({
        url: '#F53',
        content_type: 'color',
      });
      expect(result.success).toBe(true);
    });

    it('accepts hex color without hash', () => {
      const result = createLinkSchema.safeParse({
        url: 'FF5733',
        content_type: 'color',
      });
      expect(result.success).toBe(true);
    });

    it('accepts rgb color', () => {
      const result = createLinkSchema.safeParse({
        url: 'rgb(255, 87, 51)',
        content_type: 'color',
      });
      expect(result.success).toBe(true);
    });

    it('accepts rgba color', () => {
      const result = createLinkSchema.safeParse({
        url: 'rgba(255, 87, 51, 0.5)',
        content_type: 'color',
      });
      expect(result.success).toBe(true);
    });

    it('accepts hsl color', () => {
      const result = createLinkSchema.safeParse({
        url: 'hsl(9, 100%, 60%)',
        content_type: 'color',
      });
      expect(result.success).toBe(true);
    });

    it('accepts hsla color', () => {
      const result = createLinkSchema.safeParse({
        url: 'hsla(9, 100%, 60%, 0.5)',
        content_type: 'color',
      });
      expect(result.success).toBe(true);
    });

    it('accepts named color', () => {
      const result = createLinkSchema.safeParse({
        url: 'red',
        content_type: 'color',
      });
      expect(result.success).toBe(true);
    });

    it('accepts oklch color', () => {
      const result = createLinkSchema.safeParse({
        url: 'oklch(0.6 0.15 30)',
        content_type: 'color',
      });
      expect(result.success).toBe(true);
    });

    it('accepts oklab color', () => {
      const result = createLinkSchema.safeParse({
        url: 'oklab(0.6 0.1 0.05)',
        content_type: 'color',
      });
      expect(result.success).toBe(true);
    });

    it('accepts color from color_value field', () => {
      const result = createLinkSchema.safeParse({
        url: 'invalid-url',
        content_type: 'color',
        color_value: '#FF5733',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('invalid colors', () => {
    it('rejects invalid color format', () => {
      const result = createLinkSchema.safeParse({
        url: 'not-a-color',
        content_type: 'color',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid hex length', () => {
      const result = createLinkSchema.safeParse({
        url: '#FF57',
        content_type: 'color',
      });
      expect(result.success).toBe(false);
    });

    it('rejects rgb with invalid values', () => {
      const result = createLinkSchema.safeParse({
        url: 'rgb(300, 87, 51)', // 300 > 255
        content_type: 'color',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('optional fields', () => {
    it('accepts valid favicon_url', () => {
      const result = createLinkSchema.safeParse({
        url: 'https://example.com',
        favicon_url: 'https://example.com/favicon.ico',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid favicon_url', () => {
      const result = createLinkSchema.safeParse({
        url: 'https://example.com',
        favicon_url: 'not-a-url',
      });
      expect(result.success).toBe(false);
    });

    it('accepts valid og_image_url', () => {
      const result = createLinkSchema.safeParse({
        url: 'https://example.com',
        og_image_url: 'https://example.com/image.png',
      });
      expect(result.success).toBe(true);
    });

    it('accepts description', () => {
      const result = createLinkSchema.safeParse({
        url: 'https://example.com',
        description: 'A sample description',
      });
      expect(result.success).toBe(true);
    });

    it('rejects description exceeding max length', () => {
      const result = createLinkSchema.safeParse({
        url: 'https://example.com',
        description: 'x'.repeat(1001),
      });
      expect(result.success).toBe(false);
    });
  });

  describe('title validation', () => {
    it('accepts valid title', () => {
      const result = createLinkSchema.safeParse({
        url: 'https://example.com',
        title: 'Valid Title',
      });
      expect(result.success).toBe(true);
    });

    it('rejects title exceeding max length', () => {
      const result = createLinkSchema.safeParse({
        url: 'https://example.com',
        title: 'x'.repeat(501),
      });
      expect(result.success).toBe(false);
    });
  });

  describe('content_type validation', () => {
    it('accepts "url" content_type', () => {
      const result = createLinkSchema.safeParse({
        url: 'https://example.com',
        content_type: 'url',
      });
      expect(result.success).toBe(true);
    });

    it('accepts "color" content_type', () => {
      const result = createLinkSchema.safeParse({
        url: '#FF5733',
        content_type: 'color',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid content_type', () => {
      const result = createLinkSchema.safeParse({
        url: 'https://example.com',
        content_type: 'invalid',
      });
      expect(result.success).toBe(false);
    });

    it('defaults to "url" when not specified', () => {
      const result = createLinkSchema.safeParse({
        url: 'https://example.com',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.content_type).toBe('url');
      }
    });
  });
});

// =============================================================================
// updateLinkSchema Tests
// =============================================================================

describe('updateLinkSchema', () => {
  it('accepts title update', () => {
    const result = updateLinkSchema.safeParse({
      title: 'New Title',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty title', () => {
    const result = updateLinkSchema.safeParse({
      title: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects title exceeding max length', () => {
    const result = updateLinkSchema.safeParse({
      title: 'x'.repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it('accepts is_pinned update', () => {
    const result = updateLinkSchema.safeParse({
      is_pinned: true,
    });
    expect(result.success).toBe(true);
  });

  it('accepts is_archived update', () => {
    const result = updateLinkSchema.safeParse({
      is_archived: true,
    });
    expect(result.success).toBe(true);
  });

  it('accepts description update', () => {
    const result = updateLinkSchema.safeParse({
      description: 'New description',
    });
    expect(result.success).toBe(true);
  });

  it('accepts null description', () => {
    const result = updateLinkSchema.safeParse({
      description: null,
    });
    expect(result.success).toBe(true);
  });

  it('accepts multiple fields at once', () => {
    const result = updateLinkSchema.safeParse({
      title: 'New Title',
      is_pinned: true,
      description: 'New description',
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty object (no updates)', () => {
    const result = updateLinkSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

// =============================================================================
// batchActionSchema Tests
// =============================================================================

describe('batchActionSchema', () => {
  describe('add action', () => {
    it('accepts add action with links array', () => {
      const result = batchActionSchema.safeParse({
        action: 'add',
        links: [
          { url: 'https://example.com' },
          { url: 'https://google.com' },
        ],
      });
      expect(result.success).toBe(true);
    });

    it('rejects add action without links array', () => {
      const result = batchActionSchema.safeParse({
        action: 'add',
      });
      expect(result.success).toBe(false);
    });

    it('rejects add action with empty links array', () => {
      const result = batchActionSchema.safeParse({
        action: 'add',
        links: [],
      });
      expect(result.success).toBe(false);
    });

    it('rejects add action with ids instead of links', () => {
      const result = batchActionSchema.safeParse({
        action: 'add',
        ids: ['550e8400-e29b-41d4-a716-446655440000'],
      });
      expect(result.success).toBe(false);
    });
  });

  describe('delete action', () => {
    it('accepts delete action with ids array', () => {
      const result = batchActionSchema.safeParse({
        action: 'delete',
        ids: ['550e8400-e29b-41d4-a716-446655440000'],
      });
      expect(result.success).toBe(true);
    });

    it('rejects delete action without ids array', () => {
      const result = batchActionSchema.safeParse({
        action: 'delete',
      });
      expect(result.success).toBe(false);
    });

    it('rejects delete action with empty ids array', () => {
      const result = batchActionSchema.safeParse({
        action: 'delete',
        ids: [],
      });
      expect(result.success).toBe(false);
    });

    it('rejects delete action with invalid UUID', () => {
      const result = batchActionSchema.safeParse({
        action: 'delete',
        ids: ['not-a-uuid'],
      });
      expect(result.success).toBe(false);
    });
  });

  describe('restore action', () => {
    it('accepts restore action with ids array', () => {
      const result = batchActionSchema.safeParse({
        action: 'restore',
        ids: ['550e8400-e29b-41d4-a716-446655440000'],
      });
      expect(result.success).toBe(true);
    });

    it('rejects restore action without ids', () => {
      const result = batchActionSchema.safeParse({
        action: 'restore',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('permanent_delete action', () => {
    it('accepts permanent_delete action with ids array', () => {
      const result = batchActionSchema.safeParse({
        action: 'permanent_delete',
        ids: ['550e8400-e29b-41d4-a716-446655440000'],
      });
      expect(result.success).toBe(true);
    });

    it('rejects permanent_delete action without ids', () => {
      const result = batchActionSchema.safeParse({
        action: 'permanent_delete',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('pin action', () => {
    it('accepts pin action with ids array', () => {
      const result = batchActionSchema.safeParse({
        action: 'pin',
        ids: ['550e8400-e29b-41d4-a716-446655440000'],
      });
      expect(result.success).toBe(true);
    });

    it('rejects pin action without ids', () => {
      const result = batchActionSchema.safeParse({
        action: 'pin',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('unpin action', () => {
    it('accepts unpin action with ids array', () => {
      const result = batchActionSchema.safeParse({
        action: 'unpin',
        ids: ['550e8400-e29b-41d4-a716-446655440000'],
      });
      expect(result.success).toBe(true);
    });

    it('rejects unpin action without ids', () => {
      const result = batchActionSchema.safeParse({
        action: 'unpin',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('invalid action', () => {
    it('rejects invalid action type', () => {
      const result = batchActionSchema.safeParse({
        action: 'invalid_action',
        ids: ['550e8400-e29b-41d4-a716-446655440000'],
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing action', () => {
      const result = batchActionSchema.safeParse({
        ids: ['550e8400-e29b-41d4-a716-446655440000'],
      });
      expect(result.success).toBe(false);
    });
  });

  describe('multiple ids', () => {
    it('accepts multiple valid UUIDs', () => {
      const result = batchActionSchema.safeParse({
        action: 'delete',
        ids: [
          '550e8400-e29b-41d4-a716-446655440000',
          '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
          '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
        ],
      });
      expect(result.success).toBe(true);
    });

    it('rejects if any UUID is invalid', () => {
      const result = batchActionSchema.safeParse({
        action: 'delete',
        ids: [
          '550e8400-e29b-41d4-a716-446655440000',
          'not-a-uuid', // Invalid
          '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
        ],
      });
      expect(result.success).toBe(false);
    });
  });
});

// =============================================================================
// Error message tests
// =============================================================================

describe('validation error messages', () => {
  it('provides meaningful error for invalid URL', () => {
    const result = createLinkSchema.safeParse({
      url: 'not-a-url',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Invalid URL');
    }
  });

  it('provides meaningful error for long title', () => {
    const result = createLinkSchema.safeParse({
      url: 'https://example.com',
      title: 'x'.repeat(501),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Title too long');
    }
  });

  it('provides meaningful error for batch action validation', () => {
    const result = batchActionSchema.safeParse({
      action: 'delete',
      ids: [],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('action requires');
    }
  });
});
