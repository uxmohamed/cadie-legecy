/**
 * Security-related tests
 * Covers XSS prevention, injection attacks, and input sanitization
 */

import { detectContentType, detectMultipleContentTypes } from '@/lib/content-detector';
import { canonicalizeUrl, canonicalizeColor } from '@/lib/canonicalize';
import { createLinkSchema, batchActionSchema } from '@/lib/validation/link.schemas';

// =============================================================================
// XSS Prevention Tests
// =============================================================================

describe('XSS Prevention', () => {
  describe('URL handling', () => {
    it('treats javascript: URLs as potential security risk', () => {
      const result = createLinkSchema.safeParse({
        url: 'javascript:alert(1)',
      });
      // Note: The URL constructor accepts javascript: protocol
      // Security mitigation should happen at the rendering layer (rel="noopener" etc.)
      // For now, documenting this as accepted but risky
      expect(result.success).toBe(true);
      // Important: Frontend should use target="_blank" with rel="noopener noreferrer"
      // and/or filter javascript: URLs before rendering
    });

    it('treats data: URLs as potential security risk', () => {
      const result = createLinkSchema.safeParse({
        url: 'data:text/html,<script>alert(1)</script>',
      });
      // Note: data: URLs are technically valid URLs
      // Security mitigation should happen at the rendering layer
      expect(result.success).toBe(true);
      // Important: Consider adding protocol whitelist validation in a future update
    });

    it('accepts URLs with javascript in path as valid URLs', () => {
      // This is a valid URL, should be accepted but sanitized when displayed
      const result = detectContentType('https://example.com/javascript:alert(1)');
      expect(result).not.toBeNull();
      expect(result!.type).toBe('url');
      // The important thing is it's identified as URL, not executed
    });

    it('handles URL with encoded script tags', () => {
      const malicious = 'https://example.com/%3Cscript%3Ealert(1)%3C/script%3E';
      const result = canonicalizeUrl(malicious);
      // Should remain encoded, not decoded
      expect(result).not.toContain('<script>');
    });
  });

  describe('title/description handling', () => {
    it('accepts but does not execute script tags in title', () => {
      const result = createLinkSchema.safeParse({
        url: 'https://example.com',
        title: '<script>alert("xss")</script>',
      });
      // Title can contain HTML - it's the frontend's job to sanitize display
      expect(result.success).toBe(true);
    });

    it('accepts title with HTML entities', () => {
      const result = createLinkSchema.safeParse({
        url: 'https://example.com',
        title: '&lt;script&gt;alert("xss")&lt;/script&gt;',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('color handling', () => {
    it('rejects color with script injection attempt', () => {
      const result = createLinkSchema.safeParse({
        url: '#<script>alert(1)</script>',
        content_type: 'color',
      });
      expect(result.success).toBe(false);
    });

    it('rejects color with CSS injection', () => {
      const result = createLinkSchema.safeParse({
        url: 'expression(alert(1))',
        content_type: 'color',
      });
      expect(result.success).toBe(false);
    });
  });
});

// =============================================================================
// SQL Injection Prevention Tests
// =============================================================================

describe('SQL Injection Prevention', () => {
  describe('ID validation', () => {
    it('rejects IDs with SQL injection patterns', () => {
      const result = batchActionSchema.safeParse({
        action: 'delete',
        ids: ["' OR '1'='1"],
      });
      // UUID validation should reject this
      expect(result.success).toBe(false);
    });

    it('rejects IDs with DROP TABLE attempt', () => {
      const result = batchActionSchema.safeParse({
        action: 'delete',
        ids: ['1; DROP TABLE links; --'],
      });
      expect(result.success).toBe(false);
    });

    it('rejects IDs with UNION SELECT', () => {
      const result = batchActionSchema.safeParse({
        action: 'delete',
        ids: ['1 UNION SELECT * FROM users'],
      });
      expect(result.success).toBe(false);
    });
  });

  describe('URL field protection', () => {
    it('handles URL with SQL-like content', () => {
      const result = createLinkSchema.safeParse({
        url: "https://example.com?q=' OR 1=1 --",
      });
      expect(result.success).toBe(true);
      // The URL is valid, but parameters are sanitized through canonicalization
    });
  });
});

// =============================================================================
// Input Sanitization Tests
// =============================================================================

describe('Input Sanitization', () => {
  describe('whitespace handling', () => {
    it('trims leading/trailing whitespace from URLs', () => {
      const result = detectContentType('   https://example.com   ');
      expect(result).not.toBeNull();
      expect(result!.value.trim()).toBe(result!.value);
    });

    it('handles multiple newlines in batch input', () => {
      const input = 'https://a.com\n\n\nhttps://b.com';
      const result = detectMultipleContentTypes(input);
      expect(result).toHaveLength(2);
    });

    it('handles tabs in batch input', () => {
      const input = 'https://a.com\t\thttps://b.com';
      const result = detectMultipleContentTypes(input);
      expect(result).toHaveLength(2);
    });
  });

  describe('null byte handling', () => {
    it('handles null bytes in URL', () => {
      const result = canonicalizeUrl('https://example.com/path\x00/file');
      // URL constructor may strip null bytes
      expect(result).toBeDefined();
    });

    it('handles null bytes in color', () => {
      const result = canonicalizeColor('#FF5733\x00');
      expect(result).toBeDefined();
    });
  });

  describe('unicode handling', () => {
    it('handles unicode in domain names (IDN)', () => {
      const result = canonicalizeUrl('https://münchen.example.com');
      expect(result).toBeDefined();
    });

    it('handles emoji in path', () => {
      const result = canonicalizeUrl('https://example.com/page-🎉');
      expect(result).toBeDefined();
    });

    it('handles RTL characters', () => {
      const result = canonicalizeUrl('https://example.com/مرحبا');
      expect(result).toBeDefined();
    });

    it('handles zero-width characters', () => {
      const result = canonicalizeUrl('https://example.com/path\u200b'); // zero-width space
      expect(result).toBeDefined();
    });
  });

  describe('length limits', () => {
    it('URL respects max length', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(2000);
      const result = createLinkSchema.safeParse({ url: longUrl });
      expect(result.success).toBe(false);
    });

    it('title respects max length', () => {
      const result = createLinkSchema.safeParse({
        url: 'https://example.com',
        title: 'a'.repeat(501),
      });
      expect(result.success).toBe(false);
    });

    it('description respects max length', () => {
      const result = createLinkSchema.safeParse({
        url: 'https://example.com',
        description: 'a'.repeat(1001),
      });
      expect(result.success).toBe(false);
    });
  });
});

// =============================================================================
// Batch Size Validation Tests
// =============================================================================

describe('Batch Size Validation', () => {
  describe('schema acceptance of large batches', () => {
    it('accepts batch requests with 100 valid UUIDs', () => {
      // Create 100 valid UUIDs to test schema can handle large batches
      const ids = Array.from({ length: 100 }, (_, i) => 
        `550e8400-e29b-41d4-a716-4466554400${i.toString().padStart(2, '0')}`
      );
      
      const result = batchActionSchema.safeParse({
        action: 'delete',
        ids,
      });
      expect(result.success).toBe(true);
    });
  });
});

// =============================================================================
// Edge Case URL Tests
// =============================================================================

describe('Edge Case URLs', () => {
  describe('special protocols', () => {
    it('accepts file:// URLs', () => {
      const result = createLinkSchema.safeParse({
        url: 'file:///path/to/file.txt',
      });
      // File URLs are valid but may not be what users want to save
      expect(result.success).toBe(true);
    });

    it('accepts ftp:// URLs', () => {
      const result = createLinkSchema.safeParse({
        url: 'ftp://ftp.example.com/file.txt',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('special characters', () => {
    it('handles URL with parentheses', () => {
      const result = canonicalizeUrl('https://en.wikipedia.org/wiki/Example_(disambiguation)');
      expect(result).toContain('disambiguation');
    });

    it('handles URL with brackets', () => {
      const result = canonicalizeUrl('https://example.com/[page]');
      expect(result).toContain('[page]');
    });

    it('handles URL with curly braces', () => {
      const result = canonicalizeUrl('https://example.com/{id}');
      // Curly braces get URL-encoded by URL constructor
      expect(result).toContain('%7bid%7d');
    });

    it('handles URL with pipe characters', () => {
      const result = canonicalizeUrl('https://example.com/page|section');
      expect(result).toBeDefined();
    });

    it('handles URL with backticks', () => {
      const result = canonicalizeUrl('https://example.com/`code`');
      expect(result).toBeDefined();
    });
  });

  describe('query string edge cases', () => {
    it('handles empty query string', () => {
      const result = canonicalizeUrl('https://example.com?');
      expect(result).toBe('example.com');
    });

    it('handles query string with no value', () => {
      const result = canonicalizeUrl('https://example.com?key');
      expect(result).toContain('key');
    });

    it('handles query string with empty value', () => {
      const result = canonicalizeUrl('https://example.com?key=');
      expect(result).toContain('key=');
    });

    it('handles multiple ? in URL', () => {
      const result = canonicalizeUrl('https://example.com?a=1?b=2');
      expect(result).toBeDefined();
    });
  });

  describe('fragment edge cases', () => {
    it('handles empty fragment', () => {
      const result = canonicalizeUrl('https://example.com#');
      expect(result).toBe('example.com');
    });

    it('handles fragment with special characters', () => {
      const result = canonicalizeUrl('https://example.com#section-1.2.3');
      expect(result).toContain('#section-1.2.3');
    });
  });
});

// =============================================================================
// Edge Case Color Tests
// =============================================================================

describe('Edge Case Colors', () => {
  describe('hex edge cases', () => {
    it('handles lowercase hex', () => {
      const result = canonicalizeColor('#aabbcc');
      expect(result).toBe('#aabbcc');
    });

    it('handles mixed case hex', () => {
      const result = canonicalizeColor('#AaBbCc');
      expect(result).toBe('#aabbcc');
    });

    it('handles 3-digit hex with hash', () => {
      const result = canonicalizeColor('#abc');
      expect(result).toBe('#aabbcc');
    });

    it('handles 3-digit hex without hash', () => {
      const result = canonicalizeColor('abc');
      expect(result).toBe('#aabbcc');
    });
  });

  describe('rgb edge cases', () => {
    it('handles rgb with min values', () => {
      const result = canonicalizeColor('rgb(0, 0, 0)');
      expect(result).toBe('#000000');
    });

    it('handles rgb with max values', () => {
      const result = canonicalizeColor('rgb(255, 255, 255)');
      expect(result).toBe('#ffffff');
    });

    it('handles rgb with varying spacing', () => {
      const result = canonicalizeColor('rgb(255,87,51)');
      expect(result).toBe('#ff5733');
    });
  });

  describe('hsl edge cases', () => {
    it('handles hsl with 0 saturation (gray)', () => {
      const result = canonicalizeColor('hsl(0, 0%, 50%)');
      // Any hue with 0% saturation is gray
      expect(result).toMatch(/^#[0-9a-f]{6}$/);
    });

    it('handles hsl with 360 hue (same as 0)', () => {
      const result = canonicalizeColor('hsl(360, 100%, 50%)');
      expect(result).toMatch(/^#[0-9a-f]{6}$/);
    });

    it('handles hsl with 100% lightness (white)', () => {
      const result = canonicalizeColor('hsl(0, 100%, 100%)');
      expect(result).toBe('#ffffff');
    });

    it('handles hsl with 0% lightness (black)', () => {
      const result = canonicalizeColor('hsl(0, 100%, 0%)');
      expect(result).toBe('#000000');
    });
  });

  describe('modern format edge cases', () => {
    it('handles oklch with percentage values', () => {
      const result = canonicalizeColor('oklch(50% 0.15 180)');
      expect(result).toContain('oklch');
    });

    it('handles oklab with negative values', () => {
      const result = canonicalizeColor('oklab(0.5 -0.1 0.05)');
      expect(result).toContain('oklab');
    });

    it('handles color function with different color spaces', () => {
      const spaces = ['srgb', 'display-p3', 'rec2020'];
      for (const space of spaces) {
        const result = canonicalizeColor(`color(${space} 1 0.5 0)`);
        expect(result).toContain(`color(${space}`);
      }
    });
  });
});
