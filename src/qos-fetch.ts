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
 *   timeout: 15000,
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
 */
export async function qosFetch(
  url: string | URL,
  options: RequestInit & QoSFetchOptions = {}
): Promise<Response> {
  const {
    retries = 3,
    baseDelayMs = 1000,
    maxDelayMs = 30000,
    ms: timeout = 15000,
    retryStatuses = DEFAULT_RETRY_STATUSES,
    ...fetchInit
  } = options;

  const fetchWithOpts = async () => {
    return fetchWithTimeout(url as string, { ...fetchInit, timeoutMs: timeout });
  };

  const result = await withRetry(fetchWithOpts, {
    retries,
    baseDelayMs,
    maxDelayMs,
    retryableErrors: (error: unknown) => {
      if (error instanceof Response) {
        return retryStatuses.includes(error.status);
      }
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
