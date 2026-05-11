/**
 * ============================================================================
 * Throttler - Throttle function calls by rate limit
 * ============================================================================
 *
 * Throttles a function to at most N calls per time window.
 * Unlike debounce (waits for silence), throttle enforces a max rate.
 */
/**
 * Create a throttler that enforces max calls per window
 */
export function createThrottler(options = {}) {
    return new Throttler(options);
}
/**
 * Throttler class - Rate limit function calls
 */
export class Throttler {
    constructor(options = {}) {
        this.calls = new Map();
        this.startTime = Date.now();
        this.options = {
            limit: options.limit ?? 10,
            window: options.window ?? 1000,
        };
    }
    /** Throttle a function */
    throttle(fn) {
        const key = fn.name || Math.random().toString(36);
        return ((...args) => {
            const now = Date.now();
            const windowStart = now - this.options.window;
            const calls = (this.calls.get(key) || []).filter(t => t > windowStart);
            if (calls.length >= this.options.limit) {
                return; // Throttled - skip this call
            }
            calls.push(now);
            this.calls.set(key, calls);
            fn(...args);
        });
    }
    /** Clear all tracked calls */
    clear() {
        this.calls.clear();
    }
    /** Get stats */
    stats() {
        return {
            tracked: this.calls.size,
            uptime: Date.now() - this.startTime,
        };
    }
}
