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
 * Regular expressions for private/reserved IP ranges
 */
const PRIVATE_IP_PATTERNS = [
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
 * Check if a hostname appears to be an IP address
 */
function isIPAddress(hostname: string): boolean {
  // IPv4
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
    return true;
  }
  // IPv6 (simplified check)
  if (hostname.includes(':') && /^[0-9a-fA-F:]+$/.test(hostname)) {
    return true;
  }
  return false;
}

/**
 * Check if an IP address is in a private/reserved range
 */
function isPrivateIP(ip: string): boolean {
  return PRIVATE_IP_PATTERNS.some(pattern => pattern.test(ip));
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
