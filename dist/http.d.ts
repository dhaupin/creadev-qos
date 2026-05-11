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
/**
 * Check if original request was HTTPS.
 * Accepts Headers object or plain record of header name -> value.
 */
export declare function isSecureRequest(headers: Headers | Record<string, string>): boolean;
