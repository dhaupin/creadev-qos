/**
 * ============================================================================
 * HTTP Utilities
 * ============================================================================
 *
 * PURPOSE:
 * Generic HTTP request utilities for Node.js / edge runtimes.
 * Detects protocol, handles redirects, etc.
 *
 * USAGE:
 * ```typescript
 * import { isSecureRequest } from '@creadev.org/qos/http';
 *
 * const secure = isSecureRequest(request.headers);
 * ```
 *
 * ============================================================================
 */

const PROTOCOL_HEADERS = [
  'CF-Visitor',
  'X-Forwarded-Proto',
  'X-Forwarded-Scheme',
  'X-Scheme',
];

/**
 * Check if original request was HTTPS.
 * Accepts Headers object or plain record of header name -> value.
 */
export function isSecureRequest(headers: Headers | Record<string, string>): boolean {
  const getHeader = (name: string): string | null => {
    if (headers instanceof Headers) {
      return headers.get(name);
    }
    return (headers as Record<string, string>)[name] || null;
  };

  for (const headerName of PROTOCOL_HEADERS) {
    const value = getHeader(headerName);
    if (value) {
      if (headerName === 'CF-Visitor') {
        try { return JSON.parse(value).scheme === 'https'; } catch { continue; }
      }
      return value.toLowerCase() === 'https';
    }
  }
  return false;
}