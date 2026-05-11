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
export function createThrottler(options: ThrottlerOptions = {}): Throttler {
  return new Throttler(options);
}

/**
 * Throttler class - Rate limit function calls
 */
export class Throttler {
  private options: Required<ThrottlerOptions>;
  private calls = new Map<string, number[]>();
  private startTime = Date.now();

  constructor(options: ThrottlerOptions = {}) {
    this.options = {
      limit: options.limit ?? 10,
      window: options.window ?? 1000,
    };
  }

  /** Throttle a function */
  throttle<T extends (...args: any[]) => any>(fn: T): T {
    const key = fn.name || Math.random().toString(36);
    
    return ((...args: Parameters<T>) => {
      const now = Date.now();
      const windowStart = now - this.options.window;
      
      const calls = (this.calls.get(key) || []).filter(t => t > windowStart);
      
      if (calls.length >= this.options.limit) {
        return; // Throttled - skip this call
      }
      
      calls.push(now);
      this.calls.set(key, calls);
      
      fn(...args);
    }) as T;
  }

  /** Clear all tracked calls */
  clear(): void {
    this.calls.clear();
  }

  /** Get stats */
  stats(): ThrottlerStats {
    return {
      tracked: this.calls.size,
      uptime: Date.now() - this.startTime,
    };
  }
}
