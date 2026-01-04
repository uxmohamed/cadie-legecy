/**
 * Internal API Authentication
 * Provides cryptographic verification for internal service-to-service calls
 * 
 * This prevents attackers from spoofing internal requests by adding a header.
 */

/**
 * Get the internal secret from environment
 * Falls back to a generated value in development
 */
function getInternalSecret(): string {
  const secret = process.env.INTERNAL_API_SECRET;
  
  if (!secret) {
    if (process.env.NODE_ENV === 'development') {
      // In development, use a predictable secret for easier testing
      return 'dev-internal-secret-do-not-use-in-production';
    }
    throw new Error('INTERNAL_API_SECRET environment variable is required in production');
  }
  
  return secret;
}

/**
 * Generate an internal request token
 * 
 * Token format: base64({ payload, timestamp, signature })
 * - payload: The data being authenticated (e.g., linkId, action)
 * - timestamp: When the token was created (for expiry)
 * - signature: HMAC-SHA256 of payload + timestamp
 * 
 * @param payload - Data to include in the token
 * @returns Base64-encoded token string
 */
export async function generateInternalToken(payload: Record<string, unknown> = {}): Promise<string> {
  const secret = getInternalSecret();
  const timestamp = Date.now();
  const data = JSON.stringify({ ...payload, timestamp });
  
  // Create HMAC signature using Web Crypto API (Edge compatible)
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(data);
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, messageData);
  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  const signature = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Encode as base64
  const tokenData = JSON.stringify({ data, signature });
  return btoa(tokenData);
}

/**
 * Verify an internal request token
 * 
 * @param token - The token to verify
 * @param maxAgeMs - Maximum age of the token in milliseconds (default: 60 seconds)
 * @returns Object with isValid boolean and optional payload
 */
export async function verifyInternalToken(
  token: string,
  maxAgeMs: number = 60000
): Promise<{ isValid: boolean; payload?: Record<string, unknown>; reason?: string }> {
  if (!token) {
    return { isValid: false, reason: 'No token provided' };
  }
  
  try {
    const secret = getInternalSecret();
    
    // Decode the token
    const tokenData = JSON.parse(atob(token));
    const { data, signature } = tokenData;
    
    if (!data || !signature) {
      return { isValid: false, reason: 'Invalid token format' };
    }
    
    // Parse the data to get timestamp
    const parsedData = JSON.parse(data);
    const { timestamp, ...payload } = parsedData;
    
    // Check timestamp
    if (!timestamp || typeof timestamp !== 'number') {
      return { isValid: false, reason: 'Missing or invalid timestamp' };
    }
    
    const age = Date.now() - timestamp;
    if (age > maxAgeMs) {
      return { isValid: false, reason: 'Token expired' };
    }
    
    if (age < 0) {
      return { isValid: false, reason: 'Token timestamp is in the future' };
    }
    
    // Verify signature using Web Crypto API
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(data);
    
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const expectedSignatureBuffer = await crypto.subtle.sign('HMAC', key, messageData);
    const expectedSignatureArray = Array.from(new Uint8Array(expectedSignatureBuffer));
    const expectedSignature = expectedSignatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Timing-safe comparison
    let result = signature.length ^ expectedSignature.length;
    for (let i = 0; i < expectedSignature.length; i++) {
      result |= (signature.charCodeAt(i) || 0) ^ expectedSignature.charCodeAt(i);
    }
    
    if (result !== 0) {
      return { isValid: false, reason: 'Invalid signature' };
    }
    
    return { isValid: true, payload };
  } catch (error) {
    return { isValid: false, reason: 'Token parsing failed' };
  }
}

/**
 * Middleware helper to verify internal requests
 * 
 * @param request - The incoming request
 * @returns Object with isValid boolean and optional payload
 */
export async function verifyInternalRequest(
  request: Request
): Promise<{ isValid: boolean; payload?: Record<string, unknown>; reason?: string }> {
  const token = request.headers.get('X-Internal-Token');
  
  if (!token) {
    return { isValid: false, reason: 'Missing internal token header' };
  }
  
  return verifyInternalToken(token);
}

/**
 * Create headers for internal requests
 * 
 * @param payload - Optional payload to include in the token
 * @returns Headers object with internal auth token
 */
export async function createInternalHeaders(
  payload: Record<string, unknown> = {}
): Promise<Record<string, string>> {
  const token = await generateInternalToken(payload);
  return {
    'X-Internal-Token': token,
    'Content-Type': 'application/json',
  };
}
