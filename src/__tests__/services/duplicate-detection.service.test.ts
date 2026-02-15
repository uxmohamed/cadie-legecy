/**
 * Tests for duplicate-detection.service.ts
 * Covers duplicate link detection logic
 */

import { DuplicateDetectionService } from '@/features/links/services/duplicate-detection.service';
import type { CreateLinkDTO } from '@/features/links/types';
import { createMockLink, createMockColorLink, resetLinkIdCounter } from '../fixtures/link.fixtures';

describe('DuplicateDetectionService', () => {
  let service: DuplicateDetectionService;

  beforeEach(() => {
    service = new DuplicateDetectionService();
    resetLinkIdCounter();
  });

  // =============================================================================
  // isDuplicate Tests
  // =============================================================================

  describe('isDuplicate', () => {
    describe('URL duplicates', () => {
      it('detects exact URL match', () => {
        const existingLinks = [
          createMockLink({ url: 'https://example.com', content_type: 'url' }),
        ];
        const newLink: CreateLinkDTO = {
          url: 'https://example.com',
          content_type: 'url',
        };

        expect(service.isDuplicate(newLink, existingLinks)).toBe(true);
      });

      it('detects duplicate URLs with different protocols', () => {
        const existingLinks = [
          createMockLink({ url: 'https://example.com', content_type: 'url' }),
        ];
        const newLink: CreateLinkDTO = {
          url: 'http://example.com',
          content_type: 'url',
        };

        expect(service.isDuplicate(newLink, existingLinks)).toBe(true);
      });

      it('detects duplicate URLs with/without www', () => {
        const existingLinks = [
          createMockLink({ url: 'https://example.com', content_type: 'url' }),
        ];
        const newLink: CreateLinkDTO = {
          url: 'https://www.example.com',
          content_type: 'url',
        };

        expect(service.isDuplicate(newLink, existingLinks)).toBe(true);
      });

      it('detects duplicate URLs with/without trailing slash', () => {
        const existingLinks = [
          createMockLink({ url: 'https://example.com/path', content_type: 'url' }),
        ];
        const newLink: CreateLinkDTO = {
          url: 'https://example.com/path/',
          content_type: 'url',
        };

        expect(service.isDuplicate(newLink, existingLinks)).toBe(true);
      });

      it('detects duplicate URLs ignoring tracking params', () => {
        const existingLinks = [
          createMockLink({ url: 'https://example.com', content_type: 'url' }),
        ];
        const newLink: CreateLinkDTO = {
          url: 'https://example.com?utm_source=google',
          content_type: 'url',
        };

        expect(service.isDuplicate(newLink, existingLinks)).toBe(true);
      });

      it('returns false for different URLs', () => {
        const existingLinks = [
          createMockLink({ url: 'https://example.com', content_type: 'url' }),
        ];
        const newLink: CreateLinkDTO = {
          url: 'https://different.com',
          content_type: 'url',
        };

        expect(service.isDuplicate(newLink, existingLinks)).toBe(false);
      });

      it('returns false for different paths', () => {
        const existingLinks = [
          createMockLink({ url: 'https://example.com/path-a', content_type: 'url' }),
        ];
        const newLink: CreateLinkDTO = {
          url: 'https://example.com/path-b',
          content_type: 'url',
        };

        expect(service.isDuplicate(newLink, existingLinks)).toBe(false);
      });

      it('returns false for empty existing links', () => {
        const newLink: CreateLinkDTO = {
          url: 'https://example.com',
          content_type: 'url',
        };

        expect(service.isDuplicate(newLink, [])).toBe(false);
      });
    });

    describe('color duplicates', () => {
      it('detects exact hex color match', () => {
        const existingLinks = [
          createMockColorLink('#FF5733'),
        ];
        const newLink: CreateLinkDTO = {
          url: '#FF5733',
          content_type: 'color',
        };

        expect(service.isDuplicate(newLink, existingLinks)).toBe(true);
      });

      it('detects hex color match with different case', () => {
        const existingLinks = [
          createMockColorLink('#FF5733'),
        ];
        const newLink: CreateLinkDTO = {
          url: '#ff5733',
          content_type: 'color',
        };

        expect(service.isDuplicate(newLink, existingLinks)).toBe(true);
      });

      it('detects 3-digit hex expanded to 6-digit match', () => {
        const existingLinks = [
          createMockColorLink('#ff5533'),
        ];
        const newLink: CreateLinkDTO = {
          url: '#F53',
          content_type: 'color',
        };

        expect(service.isDuplicate(newLink, existingLinks)).toBe(true);
      });

      it('detects named color matching hex equivalent', () => {
        const existingLinks = [
          createMockColorLink('#ff0000'),
        ];
        const newLink: CreateLinkDTO = {
          url: 'red',
          content_type: 'color',
        };

        expect(service.isDuplicate(newLink, existingLinks)).toBe(true);
      });

      it('detects rgb matching hex equivalent', () => {
        const existingLinks = [
          createMockColorLink('#ff0000'),
        ];
        const newLink: CreateLinkDTO = {
          url: 'rgb(255, 0, 0)',
          content_type: 'color',
        };

        expect(service.isDuplicate(newLink, existingLinks)).toBe(true);
      });

      it('returns false for different colors', () => {
        const existingLinks = [
          createMockColorLink('#FF5733'),
        ];
        const newLink: CreateLinkDTO = {
          url: '#00FF00',
          content_type: 'color',
        };

        expect(service.isDuplicate(newLink, existingLinks)).toBe(false);
      });
    });

    describe('cross-type behavior', () => {
      it('does not match URL against color', () => {
        const existingLinks = [
          createMockColorLink('#FF5733'),
        ];
        const newLink: CreateLinkDTO = {
          url: 'https://example.com',
          content_type: 'url',
        };

        expect(service.isDuplicate(newLink, existingLinks)).toBe(false);
      });

      it('does not match color against URL', () => {
        const existingLinks = [
          createMockLink({ url: 'https://example.com', content_type: 'url' }),
        ];
        const newLink: CreateLinkDTO = {
          url: '#FF5733',
          content_type: 'color',
        };

        expect(service.isDuplicate(newLink, existingLinks)).toBe(false);
      });
    });

    describe('default content_type', () => {
      it('defaults to URL when content_type is not specified', () => {
        const existingLinks = [
          createMockLink({ url: 'https://example.com', content_type: 'url' }),
        ];
        const newLink: CreateLinkDTO = {
          url: 'https://example.com',
          // content_type not specified
        };

        expect(service.isDuplicate(newLink, existingLinks)).toBe(true);
      });
    });

    describe('multiple existing links', () => {
      it('finds duplicate among multiple links', () => {
        const existingLinks = [
          createMockLink({ url: 'https://google.com', content_type: 'url' }),
          createMockLink({ url: 'https://github.com', content_type: 'url' }),
          createMockLink({ url: 'https://example.com', content_type: 'url' }),
        ];
        const newLink: CreateLinkDTO = {
          url: 'https://github.com',
          content_type: 'url',
        };

        expect(service.isDuplicate(newLink, existingLinks)).toBe(true);
      });

      it('returns false when not in list', () => {
        const existingLinks = [
          createMockLink({ url: 'https://google.com', content_type: 'url' }),
          createMockLink({ url: 'https://github.com', content_type: 'url' }),
        ];
        const newLink: CreateLinkDTO = {
          url: 'https://example.com',
          content_type: 'url',
        };

        expect(service.isDuplicate(newLink, existingLinks)).toBe(false);
      });
    });
  });

  // =============================================================================
  // normalizeUrl Tests
  // =============================================================================

  describe('normalizeUrl', () => {
    it('removes trailing slashes', () => {
      expect(service.normalizeUrl('https://example.com/')).toBe('https://example.com');
    });

    it('removes trailing slashes from paths', () => {
      expect(service.normalizeUrl('https://example.com/path/')).toBe('https://example.com/path');
    });

    it('preserves protocol', () => {
      expect(service.normalizeUrl('http://example.com')).toContain('http://');
    });

    it('preserves hostname', () => {
      expect(service.normalizeUrl('https://example.com')).toContain('example.com');
    });

    it('preserves pathname', () => {
      expect(service.normalizeUrl('https://example.com/path')).toContain('/path');
    });

    it('handles invalid URLs gracefully', () => {
      const result = service.normalizeUrl('not-a-valid-url');
      expect(result).toBe('not-a-valid-url');
    });

    it('handles empty string', () => {
      expect(service.normalizeUrl('')).toBe('');
    });
  });

  // =============================================================================
  // areUrlsEquivalent Tests
  // =============================================================================

  describe('areUrlsEquivalent', () => {
    it('returns true for identical URLs', () => {
      expect(
        service.areUrlsEquivalent('https://example.com', 'https://example.com')
      ).toBe(true);
    });

    it('returns true for URLs with/without trailing slash', () => {
      expect(
        service.areUrlsEquivalent('https://example.com', 'https://example.com/')
      ).toBe(true);
    });

    it('returns true for URLs with/without trailing slash on path', () => {
      expect(
        service.areUrlsEquivalent(
          'https://example.com/path',
          'https://example.com/path/'
        )
      ).toBe(true);
    });

    it('returns false for different paths', () => {
      expect(
        service.areUrlsEquivalent(
          'https://example.com/path-a',
          'https://example.com/path-b'
        )
      ).toBe(false);
    });

    it('returns false for different domains', () => {
      expect(
        service.areUrlsEquivalent(
          'https://example.com',
          'https://different.com'
        )
      ).toBe(false);
    });

    it('handles invalid URLs gracefully', () => {
      expect(
        service.areUrlsEquivalent('not-valid', 'also-not-valid')
      ).toBe(false);
    });

    it('handles one valid, one invalid URL', () => {
      expect(
        service.areUrlsEquivalent('https://example.com', 'not-valid')
      ).toBe(false);
    });
  });
});

// =============================================================================
// Integration scenarios
// =============================================================================

describe('DuplicateDetectionService - Real-world scenarios', () => {
  let service: DuplicateDetectionService;

  beforeEach(() => {
    service = new DuplicateDetectionService();
    resetLinkIdCounter();
  });

  it('handles user copying same link from Twitter (with tracking)', () => {
    const existingLinks = [
      createMockLink({ url: 'https://example.com/article', content_type: 'url' }),
    ];
    const newLink: CreateLinkDTO = {
      url: 'https://example.com/article?utm_source=twitter&utm_medium=social',
      content_type: 'url',
    };

    expect(service.isDuplicate(newLink, existingLinks)).toBe(true);
  });

  it('handles user saving color from design tool', () => {
    const existingLinks = [
      createMockColorLink('#ff5733'),
    ];
    
    // Same color in different format
    const newLink: CreateLinkDTO = {
      url: 'rgb(255, 87, 51)',
      content_type: 'color',
    };

    expect(service.isDuplicate(newLink, existingLinks)).toBe(true);
  });

  it('handles mixed list of URLs and colors', () => {
    const existingLinks = [
      createMockLink({ url: 'https://google.com', content_type: 'url' }),
      createMockColorLink('#FF5733'),
      createMockLink({ url: 'https://github.com', content_type: 'url' }),
      createMockColorLink('red'),
    ];

    // Check URL duplicate
    expect(service.isDuplicate(
      { url: 'https://google.com', content_type: 'url' },
      existingLinks
    )).toBe(true);

    // Check color duplicate
    expect(service.isDuplicate(
      { url: '#ff0000', content_type: 'color' }, // red in hex
      existingLinks
    )).toBe(true);

    // Check new URL
    expect(service.isDuplicate(
      { url: 'https://example.com', content_type: 'url' },
      existingLinks
    )).toBe(false);

    // Check new color
    expect(service.isDuplicate(
      { url: '#00FF00', content_type: 'color' },
      existingLinks
    )).toBe(false);
  });

  it('handles large list efficiently', () => {
    // Create 1000 mock links
    const existingLinks = Array.from({ length: 1000 }, (_, i) =>
      createMockLink({ url: `https://example-${i}.com`, content_type: 'url' })
    );

    const start = performance.now();
    
    // Check duplicate (last item)
    expect(service.isDuplicate(
      { url: 'https://example-999.com', content_type: 'url' },
      existingLinks
    )).toBe(true);

    // Check non-duplicate
    expect(service.isDuplicate(
      { url: 'https://not-in-list.com', content_type: 'url' },
      existingLinks
    )).toBe(false);

    const elapsed = performance.now() - start;
    // Should complete in reasonable time (under 500ms)
    // Note: 100ms was too aggressive and caused flaky failures in CI/different environments
    expect(elapsed).toBeLessThan(500);
  });
});
