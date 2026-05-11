/**
 * ============================================================================
 * Timeout Utilities
 * ============================================================================
 *
 * PURPOSE:
 * Timeout wrapper for async operations.
 *
 * USAGE:
 * ```typescript
 * import { withTimeout, timeoutSignal } from '@creadev.org/qos/timeout';
 *
 * // With timeout
 * const result = await withTimeout(fetchData(), { ms: 5000 });
 *
 * // AbortController for fetch
 * const signal = timeoutSignal(5000);
 * fetch(url, { signal });
 * ```
 *
 * ============================================================================
 */
export interface TimeoutOptions {
    /** Timeout in ms (default: 30000) */
    ms?: number;
    /** Custom error message */
    message?: string;
}
/** Create AbortSignal with timeout */
export declare function timeoutSignal(ms: number): AbortSignal;
/** Execute function with timeout */
export declare function withTimeout<T>(operation: () => Promise<T>, options?: TimeoutOptions): Promise<T>;
/** Wrapper for fetch with timeout */
export declare function fetchWithTimeout(url: string, options?: RequestInit & {
    timeoutMs?: number;
}): Promise<Response>;
