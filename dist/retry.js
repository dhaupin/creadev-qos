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
const DEFAULT_RETRIES = 3;
const DEFAULT_BASE_DELAY_MS = 1000;
const DEFAULT_MAX_DELAY_MS = 30000;
const DEFAULT_BACKOFF = 2;
/** Calculate delay with exponential backoff */
export function calculateDelay(attempt, baseDelay, maxDelay, multiplier, jitter) {
    const delay = baseDelay * Math.pow(multiplier, attempt);
    const jitted = jitter ? delay * Math.random() * 0.25 : 0;
    return Math.min(delay + jitted, maxDelay);
}
/** Check if error is retryable */
const defaultRetryable = (error) => {
    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        // Network, timeout, rate limit errors
        return message.includes('network') ||
            message.includes('timeout') ||
            message.includes('429') ||
            message.includes('rate limit') ||
            message.includes('econnrefused') ||
            message.includes('enoent');
    }
    return true;
};
/** Retry an async operation */
export async function withRetry(operation, options = {}) {
    const { retries = DEFAULT_RETRIES, baseDelayMs = DEFAULT_BASE_DELAY_MS, maxDelayMs = DEFAULT_MAX_DELAY_MS, backoffMultiplier = DEFAULT_BACKOFF, jitter = true, retryableErrors = defaultRetryable, } = options;
    let lastError;
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await operation();
        }
        catch (error) {
            lastError = error;
            // Check if should retry
            if (attempt < retries && retryableErrors(error)) {
                const delay = calculateDelay(attempt, baseDelayMs, maxDelayMs, backoffMultiplier, jitter);
                await new Promise(r => setTimeout(r, delay));
                continue;
            }
            throw error;
        }
    }
    throw lastError;
}
/** Mark function as retryable */
export function retryable(fn, options) {
    return ((...args) => withRetry(() => fn(...args), options));
}
const DEFAULT_FAILURE_THRESHOLD = 5;
const DEFAULT_SUCCESS_THRESHOLD = 3;
const DEFAULT_RESET_TIMEOUT_MS = 30000;
/** Circuit breaker state */
export class CircuitBreaker {
    constructor(options = {}) {
        this.state = 'closed';
        this.failures = 0;
        this.successes = 0;
        this.nextAttempt = 0;
        this.options = {
            failureThreshold: options.failureThreshold ?? DEFAULT_FAILURE_THRESHOLD,
            successThreshold: options.successThreshold ?? DEFAULT_SUCCESS_THRESHOLD,
            resetTimeoutMs: options.resetTimeoutMs ?? DEFAULT_RESET_TIMEOUT_MS,
        };
    }
    /** Check if circuit allows execution */
    get canExecute() {
        if (this.state === 'closed')
            return true;
        if (this.state === 'open' && Date.now() > this.nextAttempt) {
            this.state = 'half-open';
            this.successes = 0;
            return true;
        }
        return false;
    }
    /** Get current state */
    get status() {
        return this.state;
    }
    /** Get time until next attempt */
    get retryAfter() {
        return Math.max(0, this.nextAttempt - Date.now());
    }
    /** Execute operation with circuit protection */
    async execute(operation) {
        if (!this.canExecute) {
            throw new Error(`Circuit open. Retry after ${this.retryAfter}s`);
        }
        try {
            const result = await operation();
            this.onSuccess();
            return result;
        }
        catch (error) {
            this.onFailure();
            throw error;
        }
    }
    onSuccess() {
        this.failures = 0;
        if (this.state === 'half-open') {
            this.successes++;
            if (this.successes >= this.options.successThreshold) {
                this.state = 'closed';
            }
        }
    }
    onFailure() {
        this.failures++;
        if (this.state === 'half-open') {
            this.state = 'open';
            this.nextAttempt = Date.now() + this.options.resetTimeoutMs;
        }
        else if (this.failures >= this.options.failureThreshold) {
            this.state = 'open';
            this.nextAttempt = Date.now() + this.options.resetTimeoutMs;
        }
    }
    /** Reset circuit */
    reset() {
        this.state = 'closed';
        this.failures = 0;
        this.successes = 0;
        this.nextAttempt = 0;
    }
}
