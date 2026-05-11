/**
 * @creadev.org/qos
 *
 * Quality of Service utilities - retry, timeout, circuit breaker.
 *
 * EXAMPLES:
 * ```typescript
 * import { withRetry, CircuitBreaker, withTimeout } from '@creadev.org/qos';
 *
 * // Retry with backoff
 * const result = await withRetry(fetchData(), { retries: 3 });
 *
 * // Circuit breaker
 * const breaker = new CircuitBreaker({ failureThreshold: 5 });
 * await breaker.execute(() => apiCall());
 *
 * // Timeout
 * const result = await withTimeout(fetchData(), { ms: 5000 });
 * ```
 *
 * ============================================================================
 */
export { withRetry, retryable, CircuitBreaker, calculateDelay, } from './retry';
export type { RetryOptions } from './retry';
export { withTimeout, timeoutSignal, fetchWithTimeout, } from './timeout';
export type { TimeoutOptions } from './timeout';
export { isSecureRequest } from './http';
export { Throttler, createThrottler } from './throttler';
export type { ThrottlerOptions, ThrottlerStats } from './throttler';
export { Bulkhead, createBulkhead } from './bulkhead';
export type { BulkheadOptions, BulkheadStats } from './bulkhead';
