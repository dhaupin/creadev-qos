/**
 * ============================================================================
 * Bulkhead - Concurrency isolation
 * ============================================================================
 *
 * Limits concurrent executions, queues excess calls.
 * Useful for protecting APIs from overwhelming.
 */
export interface BulkheadOptions {
    /** Max concurrent executions (default: 10) */
    concurrency?: number;
}
export interface BulkheadStats {
    running: number;
    queued: number;
    uptime: number;
}
/**
 * Bulkhead class - Concurrency limiting
 */
export declare class Bulkhead {
    private options;
    private running;
    private queue;
    private startTime;
    constructor(options?: BulkheadOptions);
    /** Check if at capacity */
    isFull(): boolean;
    /** Execute function, respecting concurrency limit */
    run<T>(fn: () => Promise<T>): Promise<T>;
    /** Get current stats */
    getStatus(): BulkheadStats;
}
/**
 * Create a bulkhead instance
 */
export declare function createBulkhead(options?: BulkheadOptions): Bulkhead;
