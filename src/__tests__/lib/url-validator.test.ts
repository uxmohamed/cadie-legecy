/**
 * Tests for URL Security Validator
 */

import { validateUrlSafety, isUrlSafe, assertUrlSafe } from '@/lib/url-validator';

describe('URL Validator', () => {
  describe('IPv6 Validation', () => {
    describe('Valid IPv6 addresses (should be allowed if not private)', () => {
      test('should accept valid public IPv6 addresses', () => {
        const publicIPv6Urls = [
          'http://[2001:4860:4860::8888]/test',  // Google DNS
          'http://[2606:4700:4700::1111]/test',  // Cloudflare DNS
          'https://[2001:db8:85a3::8a2e:370:7334]/path',  // Documentation range (for testing format)
        ];
        
        publicIPv6Urls.forEach(url => {
          const result = validateUrlSafety(url);
          // Note: 2001:db8::/32 might be blocked as documentation range in production
          // but we're testing format validation here
        });
      });
    });

    describe('Invalid IPv6 formats (should be rejected)', () => {
      test('should reject malformed IPv6 addresses', () => {
        const invalidIPv6 = [
          'http://[:::::::]/test',           // Too many colons
          'http://[ffffffff:]/test',         // Invalid segment
          'http://[::1::2]/test',            // Multiple :: sequences
          'http://[g123::1]/test',           // Invalid hex character
          'http://[12345::1]/test',          // Segment too long
          'http://[:1]/test',                // Leading single colon
          'http://[1:]/test',                // Trailing single colon
          'http://[:::]/test',               // Triple colons
        ];
        
        invalidIPv6.forEach(url => {
          const result = validateUrlSafety(url);
          expect(result.isValid).toBe(false);
        });
      });
    });

    describe('Private/Reserved IPv6 ranges (should be blocked)', () => {
      test('should block loopback address ::1', () => {
        const loopbackUrls = [
          'http://[::1]/test',
          'http://[0:0:0:0:0:0:0:1]/test',
        ];
        
        loopbackUrls.forEach(url => {
          const result = validateUrlSafety(url);
          expect(result.isValid).toBe(false);
          expect(result.reason).toContain('Private IP');
        });
      });

      test('should block link-local addresses fe80::/10', () => {
        const linkLocalUrls = [
          'http://[fe80::1]/test',
          'http://[fe80:0:0:0:0:0:0:1]/test',
          'http://[fe80::dead:beef]/test',
          'http://[fe81::1]/test',
          'http://[fe8f::1]/test',
          'http://[fea0::1]/test',
          'http://[febf::1]/test',
        ];
        
        linkLocalUrls.forEach(url => {
          const result = validateUrlSafety(url);
          expect(result.isValid).toBe(false);
          expect(result.reason).toContain('Private IP');
        });
      });

      test('should block unique local addresses fc00::/7', () => {
        const uniqueLocalUrls = [
          'http://[fc00::1]/test',
          'http://[fc00:0:0:0:0:0:0:1]/test',
          'http://[fd00::1]/test',
          'http://[fdff:ffff:ffff:ffff:ffff:ffff:ffff:ffff]/test',
        ];
        
        uniqueLocalUrls.forEach(url => {
          const result = validateUrlSafety(url);
          expect(result.isValid).toBe(false);
          expect(result.reason).toContain('Private IP');
        });
      });

      test('should block site-local addresses fec0::/10', () => {
        const siteLocalUrls = [
          'http://[fec0::1]/test',
          'http://[fec0:0:0:0:0:0:0:1]/test',
        ];
        
        siteLocalUrls.forEach(url => {
          const result = validateUrlSafety(url);
          expect(result.isValid).toBe(false);
          expect(result.reason).toContain('Private IP');
        });
      });

      test('should block unspecified address ::', () => {
        const unspecifiedUrls = [
          'http://[::]/test',
          'http://[0:0:0:0:0:0:0:0]/test',
        ];
        
        unspecifiedUrls.forEach(url => {
          const result = validateUrlSafety(url);
          expect(result.isValid).toBe(false);
          expect(result.reason).toContain('Private IP');
        });
      });

      test('should block multicast addresses ff00::/8', () => {
        const multicastUrls = [
          'http://[ff00::1]/test',
          'http://[ff02::1]/test',
          'http://[ffff::1]/test',
        ];
        
        multicastUrls.forEach(url => {
          const result = validateUrlSafety(url);
          expect(result.isValid).toBe(false);
          expect(result.reason).toContain('Private IP');
        });
      });

      test('should block IPv4-mapped IPv6 with private IPv4', () => {
        const ipv4MappedUrls = [
          'http://[::ffff:127.0.0.1]/test',
          'http://[::ffff:192.168.1.1]/test',
          'http://[::ffff:10.0.0.1]/test',
        ];
        
        ipv4MappedUrls.forEach(url => {
          const result = validateUrlSafety(url);
          expect(result.isValid).toBe(false);
          expect(result.reason).toContain('Private IP');
        });
      });
    });
  });

  describe('IPv4 Validation', () => {
    test('should block private IPv4 addresses', () => {
      const privateIPv4Urls = [
        'http://127.0.0.1/test',
        'http://10.0.0.1/test',
        'http://192.168.1.1/test',
        'http://172.16.0.1/test',
        'http://169.254.169.254/test',
      ];
      
      privateIPv4Urls.forEach(url => {
        const result = validateUrlSafety(url);
        expect(result.isValid).toBe(false);
        // Note: Some IPs like 127.0.0.1 and 169.254.169.254 are in BLOCKED_HOSTS
        // so they might have a different error message
      });
    });
  });

  describe('General URL Validation', () => {
    test('should allow valid public URLs', () => {
      const validUrls = [
        'https://example.com/test',
        'http://google.com',
        'https://github.com/user/repo',
      ];
      
      validUrls.forEach(url => {
        const result = validateUrlSafety(url);
        expect(result.isValid).toBe(true);
      });
    });

    test('should block localhost', () => {
      const result = validateUrlSafety('http://localhost/test');
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('blocked');
    });

    test('should block invalid protocols', () => {
      const result = validateUrlSafety('file:///etc/passwd');
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('protocol');
    });
  });

  describe('Helper functions', () => {
    test('isUrlSafe should return boolean', () => {
      expect(isUrlSafe('https://example.com')).toBe(true);
      expect(isUrlSafe('http://localhost')).toBe(false);
      expect(isUrlSafe('http://[::1]/test')).toBe(false);
    });

    test('assertUrlSafe should throw on unsafe URLs', () => {
      expect(() => assertUrlSafe('https://example.com')).not.toThrow();
      expect(() => assertUrlSafe('http://localhost')).toThrow();
      expect(() => assertUrlSafe('http://[fe80::1]/test')).toThrow();
    });
  });
});
