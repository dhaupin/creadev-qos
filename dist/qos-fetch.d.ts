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
import { TimeoutOptions } from './timeout';
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
/**
 * Fetch with retry + timeout in one
 */
export declare function qosFetch(url: string | URL, options?: RequestInit & QoSFetchOptions): Promise<Response>;
