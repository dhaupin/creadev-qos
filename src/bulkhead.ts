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

interface QueuedCall<T> {
  fn: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
}

/**
 * Bulkhead class - Concurrency limiting
 */
export class Bulkhead {
  private options: Required<BulkheadOptions>;
  private running = 0;
  private queue: QueuedCall<any>[] = [];
  private startTime = Date.now();

  constructor(options: BulkheadOptions = {}) {
    this.options = {
      concurrency: options.concurrency ?? 10,
    };
  }

  /** Check if at capacity */
  isFull(): boolean {
    return this.running >= this.options.concurrency;
  }

  /** Execute function, respecting concurrency limit */
  async run<T>(fn: () => Promise<T>): Promise<T> {
    if (this.running >= this.options.concurrency) {
      // Queue the call
      return new Promise<T>((resolve, reject) => {
        this.queue.push({ fn, resolve, reject });
      });
    }

    this.running++;
    try {
      const result = await fn();
      return result;
    } finally {
      this.running--;
      
      // Process next from queue
      if (this.queue.length > 0) {
        const next = this.queue.shift()!;
        this.running++;
        
        try {
          const r = await next.fn();
          next.resolve(r);
        } catch (e) {
          next.reject(e as Error);
        }
      }
    }
  }

  /** Get current stats */
  getStatus(): BulkheadStats {
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
export function createBulkhead(options: BulkheadOptions = {}): Bulkhead {
  return new Bulkhead(options);
}
