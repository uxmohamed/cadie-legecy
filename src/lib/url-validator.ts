/**
 * URL Security Validator
 * Prevents SSRF attacks by blocking requests to internal/private networks
 */

/**
 * Blocked hostnames that should never be fetched
 */
const BLOCKED_HOSTS = new Set([
  // Loopback
  'localhost',
  'localhost.localdomain',
  '127.0.0.1',
  '::1',
  '0.0.0.0',
  
  // Cloud metadata endpoints
  '169.254.169.254',           // AWS/GCP/Azure metadata
  'metadata.google.internal',   // GCP metadata
  'metadata.goog',             // GCP metadata
  'kubernetes.default.svc',    // Kubernetes
  '100.100.100.200',           // Alibaba Cloud metadata
  
  // Link-local
  '169.254.0.0',
  
  // Private network indicators
  'internal',
  'local',
  'private',
]);

/**
 * Blocked hostname suffixes
 */
const BLOCKED_SUFFIXES = [
  '.internal',
  '.local',
  '.localhost',
  '.localdomain',
  '.svc.cluster.local',  // Kubernetes
];

/**
 * Regular expressions for private/reserved IPv4 ranges
 */
const PRIVATE_IPV4_PATTERNS = [
  /^10\./,                                    // 10.0.0.0/8 - Private
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,          // 172.16.0.0/12 - Private
  /^192\.168\./,                              // 192.168.0.0/16 - Private
  /^127\./,                                   // 127.0.0.0/8 - Loopback
  /^169\.254\./,                              // 169.254.0.0/16 - Link-local
  /^0\./,                                     // 0.0.0.0/8 - Reserved
  /^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\./, // 100.64.0.0/10 - CGNAT
  /^192\.0\.0\./,                             // 192.0.0.0/24 - Reserved
  /^192\.0\.2\./,                             // 192.0.2.0/24 - Documentation
  /^198\.51\.100\./,                          // 198.51.100.0/24 - Documentation
  /^203\.0\.113\./,                           // 203.0.113.0/24 - Documentation
  /^224\./,                                   // 224.0.0.0/4 - Multicast
  /^240\./,                                   // 240.0.0.0/4 - Reserved
  /^255\./,                                   // 255.0.0.0/8 - Broadcast
];

/**
 * Validate IPv6 address format
 * Checks for proper IPv6 structure including:
 * - Full form (8 groups of hex digits)
 * - Compressed form (using ::)
 * - Mixed IPv4-mapped IPv6
 */
function isValidIPv6(ip: string): boolean {
  // Remove brackets if present (from URL format)
  const addr = ip.replace(/^\[|\]$/g, '');
  
  // Check for invalid characters
  if (!/^[0-9a-fA-F:.]+$/.test(addr)) {
    return false;
  }
  
  // Count colons - valid IPv6 should have between 2-7 colons
  const colonCount = (addr.match(/:/g) || []).length;
  if (colonCount < 2 || colonCount > 7) {
    return false;
  }
  
  // Check for multiple :: sequences (only one allowed)
  if ((addr.match(/::/g) || []).length > 1) {
    return false;
  }
  
  // Check for invalid patterns like :::: or ::: 
  if (/:{3,}/.test(addr)) {
    return false;
  }
  
  // Check for leading/trailing single colons (except ::)
  if (/^:[^:]/.test(addr) || /[^:]:$/.test(addr)) {
    return false;
  }
  
  // Check if using compression (::)
  const hasCompression = addr.includes('::');
  
  if (hasCompression) {
    // Split by :: to handle compressed notation
    const parts = addr.split('::');
    if (parts.length > 2) {
      return false;
    }
    
    // Validate each part
    for (const part of parts) {
      if (part === '') continue;
      
      const segments = part.split(':');
      for (const segment of segments) {
        // Each segment should be 1-4 hex digits
        if (segment.length > 4 || !/^[0-9a-fA-F]{1,4}$/.test(segment)) {
          return false;
        }
      }
      
      // Part should not have more than 7 segments when using ::
      if (segments.length > 7) {
        return false;
      }
    }
  } else {
    // Full form - must have exactly 8 segments
    const segments = addr.split(':');
    if (segments.length !== 8) {
      return false;
    }
    
    for (const segment of segments) {
      // Each segment should be 1-4 hex digits
      if (segment.length > 4 || !/^[0-9a-fA-F]{1,4}$/.test(segment)) {
        return false;
      }
    }
  }
  
  return true;
}

/**
 * Check if IPv6 address is in a private or reserved range
 */
function isPrivateIPv6(ip: string): boolean {
  // Remove brackets if present
  const addr = ip.replace(/^\[|\]$/g, '').toLowerCase();
  
  // Loopback ::1
  if (addr === '::1' || addr === '0:0:0:0:0:0:0:1') {
    return true;
  }
  
  // Unspecified address ::
  if (addr === '::' || addr === '0:0:0:0:0:0:0:0') {
    return true;
  }
  
  // Link-local fe80::/10
  if (/^fe[89ab][0-9a-f]:/i.test(addr)) {
    return true;
  }
  
  // Unique local addresses fc00::/7 (includes fd00::/8)
  if (/^f[cd]/i.test(addr)) {
    return true;
  }
  
  // Site-local (deprecated but still blocked) fec0::/10
  if (/^fec[0-9a-f]:/i.test(addr)) {
    return true;
  }
  
  // Multicast ff00::/8
  if (/^ff/i.test(addr)) {
    return true;
  }
  
  // IPv4-mapped IPv6 addresses ::ffff:0:0/96
  // The URL parser normalizes these, so check for both formats
  if (/^::ffff:/i.test(addr)) {
    // Extract the last part which could be in hex format
    // e.g., ::ffff:7f00:1 (normalized) represents ::ffff:127.0.0.1
    const parts = addr.split(':');
    if (parts.length >= 2) {
      const lastTwo = parts.slice(-2);
      // Check if it's in the private range by converting hex to IP
      // For simplicity, we know ::ffff: prefix maps IPv4, and most private IPs will be caught
      // Common patterns: ::ffff:7f00::/104 is 127.0.0.0/8
      //                 ::ffff:a00::/104 is 10.0.0.0/8
      //                 ::ffff:c0a8::/112 is 192.168.0.0/16
      //                 ::ffff:ac10::/108 is 172.16.0.0/12
      
      // Match common private IPv4 ranges in hex format
      // 127.0.0.0/8 -> 7f00::/8 in the last 32 bits
      if (/^7f[0-9a-f]{2}:/i.test(lastTwo.join(':'))) {
        return true;
      }
      // 10.0.0.0/8 -> a00::/8
      if (/^(0)?a[0-9a-f]{2}:/i.test(lastTwo.join(':'))) {
        return true;
      }
      // 192.168.0.0/16 -> c0a8::/16
      if (/^c0a8:/i.test(lastTwo.join(':'))) {
        return true;
      }
      // 172.16.0.0/12 -> ac10::/12 to ac1f::/12
      if (/^ac1[0-9a-f]:/i.test(lastTwo.join(':'))) {
        return true;
      }
      // 169.254.0.0/16 -> a9fe::/16
      if (/^a9fe:/i.test(lastTwo.join(':'))) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Check if a hostname appears to be an IP address
 */
function isIPAddress(hostname: string): boolean {
  // IPv4
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
    return true;
  }
  
  // IPv6 - more robust check
  // Remove brackets that might be present in URL format
  const addr = hostname.replace(/^\[|\]$/g, '');
  if (addr.includes(':') && isValidIPv6(addr)) {
    return true;
  }
  
  return false;
}

/**
 * Check if an IPv4 address is in a private/reserved range
 */
function isPrivateIPv4(ip: string): boolean {
  return PRIVATE_IPV4_PATTERNS.some(pattern => pattern.test(ip));
}

/**
 * Check if an IP address (IPv4 or IPv6) is in a private/reserved range
 */
function isPrivateIP(ip: string): boolean {
  // Remove brackets for IPv6
  const addr = ip.replace(/^\[|\]$/g, '');
  
  // Check if it's IPv6
  if (addr.includes(':')) {
    return isPrivateIPv6(addr);
  }
  
  // Otherwise treat as IPv4
  return isPrivateIPv4(addr);
}

/**
 * Validates if a URL is safe to fetch (not targeting internal resources)
 * 
 * @param url - The URL to validate
 * @returns Object with isValid boolean and optional reason
 */
export function validateUrlSafety(url: string): { isValid: boolean; reason?: string } {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    const protocol = urlObj.protocol;
    
    // Only allow HTTP and HTTPS protocols
    if (protocol !== 'http:' && protocol !== 'https:') {
      return { 
        isValid: false, 
        reason: `Invalid protocol: ${protocol}. Only HTTP and HTTPS are allowed.` 
      };
    }
    
    // Block explicitly blocked hostnames
    if (BLOCKED_HOSTS.has(hostname)) {
      return { 
        isValid: false, 
        reason: 'Hostname is blocked for security reasons.' 
      };
    }
    
    // Block hostnames with blocked suffixes
    for (const suffix of BLOCKED_SUFFIXES) {
      if (hostname.endsWith(suffix)) {
        return { 
          isValid: false, 
          reason: 'Internal hostnames are not allowed.' 
        };
      }
    }
    
    // Check if hostname is an IP address
    if (isIPAddress(hostname)) {
      if (isPrivateIP(hostname)) {
        return { 
          isValid: false, 
          reason: 'Private IP addresses are not allowed.' 
        };
      }
    }
    
    // Block URLs with credentials
    if (urlObj.username || urlObj.password) {
      return { 
        isValid: false, 
        reason: 'URLs with credentials are not allowed.' 
      };
    }
    
    // Block unusual ports commonly used for internal services
    const port = urlObj.port;
    if (port) {
      const blockedPorts = ['22', '23', '25', '3306', '5432', '6379', '27017', '9200', '11211'];
      if (blockedPorts.includes(port)) {
        return { 
          isValid: false, 
          reason: `Port ${port} is blocked for security reasons.` 
        };
      }
    }
    
    return { isValid: true };
  } catch {
    return { 
      isValid: false, 
      reason: 'Invalid URL format.' 
    };
  }
}

/**
 * Simple boolean check for URL safety
 * 
 * @param url - The URL to validate
 * @returns true if the URL is safe to fetch
 */
export function isUrlSafe(url: string): boolean {
  return validateUrlSafety(url).isValid;
}

/**
 * Validate a URL and throw an error if unsafe
 * 
 * @param url - The URL to validate
 * @throws Error if the URL is not safe
 */
export function assertUrlSafe(url: string): void {
  const result = validateUrlSafety(url);
  if (!result.isValid) {
    throw new Error(result.reason || 'URL validation failed');
  }
}
