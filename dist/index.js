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
export { withTimeout, timeoutSignal, fetchWithTimeout, } from './timeout';
export { isSecureRequest } from './http';
// NEW from vant: Throttler
export { Throttler, createThrottler } from './throttler';
// NEW from vant: Bulkhead
export { Bulkhead, createBulkhead } from './bulkhead';
