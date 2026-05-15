/**
 * ============================================================================
 * qosFetch - Combined retry + timeout in one
 * ============================================================================
 *
 * PURPOSE:
 * Convenience wrapper combining withRetry + fetchWithTimeout for common
 * fetch use cases.
 *
 * USAGE:
 * ```typescript
 * import { qosFetch } from '@creadev.org/qos';
 *
 * const res = await qosFetch('https://api.example.com/data', {
 *   retries: 3,
 *   baseDelayMs: 1000,
 *   timeoutMs: 15000,
 * });
 * ```
 * ============================================================================
 */

import { withRetry } from './retry';
import { fetchWithTimeout, TimeoutOptions } from './timeout';

export interface QoSFetchOptions extends TimeoutOptions {
  /** Max retry attempts (default: 3) */
  retries?: number;
  /** Base delay in ms (default: 1000) */
  baseDelayMs?: number;
  /** Max delay cap in ms (default: 30000) */
  maxDelayMs?: number;
  /** Retryable HTTP status codes */
  retryStatuses?: number[];
}

/** Default retryable status codes */
const DEFAULT_RETRY_STATUSES = [408, 429, 500, 502, 503, 504];

/**
 * Fetch with retry + timeout in one
 * 
 * @param url - URL to fetch
 * @param init - Fetch options
 * @param options - QoS options (retries, timeout, etc.)
 */
export async function qosFetch(
  url: string | URL,
  init?: RequestInit,
  options: QoSFetchOptions = {}
): Promise<Response> {
  const {
    retries = 3,
    baseDelayMs = 1000,
    maxDelayMs = 30000,
    timeoutMs = 15000,
    retryStatuses = DEFAULT_RETRY_STATUSES,
  } = options;

  const fetchWithOpts = async () => {
    return fetchWithTimeout(url, init, timeoutMs);
  };

  const result = await withRetry(fetchWithOpts, {
    retries,
    baseDelayMs,
    maxDelayMs,
    retryableErrors: (error: unknown) => {
      // Check for retryable HTTP status
      if (error instanceof Response) {
        return retryStatuses.includes(error.status);
      }
      // Check for network errors (includes AbortError for timeout)
      if (error instanceof Error) {
        const msg = error.message.toLowerCase();
        return msg.includes('network') || 
               msg.includes('timeout') ||
               msg.includes('abort');
      }
      return true;
    },
  });

  return result;
}
