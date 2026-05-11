/**
 * ============================================================================
 * Retry Utilities
 * ============================================================================
 *
 * PURPOSE:
 * Retry with exponential backoff for async operations.
 *
 * USAGE:
 * ```typescript
 * import { withRetry, retryable, CircuitBreaker } from '@creadev.org/qos/retry';
 *
 * // Retry with defaults
 * const result = await withRetry(() => fetchData(), { retries: 3 });
 *
 * // Circuit breaker
 * const breaker = new CircuitBreaker({ failureThreshold: 5 });
 * await breaker.execute(() => riskyOperation());
 * ```
 *
 * ============================================================================
 */
export interface RetryOptions {
    /** Max retry attempts (default: 3) */
    retries?: number;
    /** Base delay in ms (default: 1000) */
    baseDelayMs?: number;
    /** Max delay cap in ms (default: 30000) */
    maxDelayMs?: number;
    /** Backoff multiplier (default: 2) */
    backoffMultiplier?: number;
    /** Add jitter 0-25% (default: true) */
    jitter?: boolean;
    /** Retry on specific errors */
    retryableErrors?: ((error: unknown) => boolean);
}
/** Calculate delay with exponential backoff */
export declare function calculateDelay(attempt: number, baseDelay: number, maxDelay: number, multiplier: number, jitter: boolean): number;
/** Retry an async operation */
export declare function withRetry<T>(operation: () => Promise<T>, options?: RetryOptions): Promise<T>;
/** Mark function as retryable */
export declare function retryable<T extends (...args: unknown[]) => Promise<unknown>>(fn: T, options?: RetryOptions): T;
export interface CircuitBreakerOptions {
    /** Failures before opening circuit (default: 5) */
    failureThreshold?: number;
    /** Successes before closing circuit (default: 3) */
    successThreshold?: number;
    /** Open duration in ms (default: 30000) */
    resetTimeoutMs?: number;
}
type CircuitState = 'closed' | 'open' | 'half-open';
/** Circuit breaker state */
export declare class CircuitBreaker {
    private state;
    private failures;
    private successes;
    private nextAttempt;
    private options;
    constructor(options?: CircuitBreakerOptions);
    /** Check if circuit allows execution */
    get canExecute(): boolean;
    /** Get current state */
    get status(): CircuitState;
    /** Get time until next attempt */
    get retryAfter(): number;
    /** Execute operation with circuit protection */
    execute<T>(operation: () => Promise<T>): Promise<T>;
    private onSuccess;
    private onFailure;
    /** Reset circuit */
    reset(): void;
}
export {};
