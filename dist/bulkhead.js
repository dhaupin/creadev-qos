/**
 * ============================================================================
 * Bulkhead - Concurrency isolation
 * ============================================================================
 *
 * Limits concurrent executions, queues excess calls.
 * Useful for protecting APIs from overwhelming.
 */
/**
 * Bulkhead class - Concurrency limiting
 */
export class Bulkhead {
    constructor(options = {}) {
        this.running = 0;
        this.queue = [];
        this.startTime = Date.now();
        this.options = {
            concurrency: options.concurrency ?? 10,
        };
    }
    /** Check if at capacity */
    isFull() {
        return this.running >= this.options.concurrency;
    }
    /** Execute function, respecting concurrency limit */
    async run(fn) {
        if (this.running >= this.options.concurrency) {
            // Queue the call
            return new Promise((resolve, reject) => {
                this.queue.push({ fn, resolve, reject });
            });
        }
        this.running++;
        try {
            const result = await fn();
            return result;
        }
        finally {
            this.running--;
            // Process next from queue
            if (this.queue.length > 0) {
                const next = this.queue.shift();
                this.running++;
                try {
                    const r = await next.fn();
                    next.resolve(r);
                }
                catch (e) {
                    next.reject(e);
                }
            }
        }
    }
    /** Get current stats */
    getStatus() {
        return {
            running: this.running,
            queued: this.queue.length,
            uptime: Date.now() - this.startTime,
        };
    }
}
/**
 * Create a bulkhead instance
 */
export function createBulkhead(options = {}) {
    return new Bulkhead(options);
}
