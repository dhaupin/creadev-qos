/**
 * ============================================================================
 * Throttler - Throttle function calls by rate limit
 * ============================================================================
 *
 * Throttles a function to at most N calls per time window.
 * Unlike debounce (waits for silence), throttle enforces a max rate.
 */
export interface ThrottlerOptions {
    /** Max calls per window (default: 10) */
    limit?: number;
    /** Window size in ms (default: 1000) */
    window?: number;
}
export interface ThrottlerStats {
    tracked: number;
    uptime: number;
}
/**
 * Create a throttler that enforces max calls per window
 */
export declare function createThrottler(options?: ThrottlerOptions): Throttler;
/**
 * Throttler class - Rate limit function calls
 */
export declare class Throttler {
    private options;
    private calls;
    private startTime;
    constructor(options?: ThrottlerOptions);
    /** Throttle a function */
    throttle<T extends (...args: any[]) => any>(fn: T): T;
    /** Clear all tracked calls */
    clear(): void;
    /** Get stats */
    stats(): ThrottlerStats;
}
