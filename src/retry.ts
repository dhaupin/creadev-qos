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

const DEFAULT_RETRIES = 3;
const DEFAULT_BASE_DELAY_MS = 1000;
const DEFAULT_MAX_DELAY_MS = 30000;
const DEFAULT_BACKOFF = 2;

/** Calculate delay with exponential backoff */
export function calculateDelay(
  attempt: number,
  baseDelay: number,
  maxDelay: number,
  multiplier: number,
  jitter: boolean
): number {
  const delay = baseDelay * Math.pow(multiplier, attempt);
  const jitted = jitter ? delay * Math.random() * 0.25 : 0;
  return Math.min(delay + jitted, maxDelay);
}

/** Check if error is retryable */
const defaultRetryable = (error: unknown): boolean => {
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
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    retries = DEFAULT_RETRIES,
    baseDelayMs = DEFAULT_BASE_DELAY_MS,
    maxDelayMs = DEFAULT_MAX_DELAY_MS,
    backoffMultiplier = DEFAULT_BACKOFF,
    jitter = true,
    retryableErrors = defaultRetryable,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Check if should retry
      if (attempt < retries && retryableErrors(error)) {
        const delay = calculateDelay(
          attempt,
          baseDelayMs,
          maxDelayMs,
          backoffMultiplier,
          jitter
        );
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      
      throw error;
    }
  }

  throw lastError;
}

/** Mark function as retryable */
export function retryable<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  options?: RetryOptions
): T {
  return ((...args: unknown[]) => withRetry(() => fn(...args), options)) as T;
}

// ============================================================================
// CIRCUIT BREAKER
// ============================================================================

export interface CircuitBreakerOptions {
  /** Failures before opening circuit (default: 5) */
  failureThreshold?: number;
  /** Successes before closing circuit (default: 3) */
  successThreshold?: number;
  /** Open duration in ms (default: 30000) */
  resetTimeoutMs?: number;
}

const DEFAULT_FAILURE_THRESHOLD = 5;
const DEFAULT_SUCCESS_THRESHOLD = 3;
const DEFAULT_RESET_TIMEOUT_MS = 30000;

type CircuitState = 'closed' | 'open' | 'half-open';

/** Circuit breaker state */
export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failures = 0;
  private successes = 0;
  private nextAttempt: number = 0;
  private options: Required<CircuitBreakerOptions>;

  constructor(options: CircuitBreakerOptions = {}) {
    this.options = {
      failureThreshold: options.failureThreshold ?? DEFAULT_FAILURE_THRESHOLD,
      successThreshold: options.successThreshold ?? DEFAULT_SUCCESS_THRESHOLD,
      resetTimeoutMs: options.resetTimeoutMs ?? DEFAULT_RESET_TIMEOUT_MS,
    };
  }

  /** Check if circuit allows execution */
  get canExecute(): boolean {
    if (this.state === 'closed') return true;
    if (this.state === 'open' && Date.now() > this.nextAttempt) {
      this.state = 'half-open';
      this.successes = 0;
      return true;
    }
    return false;
  }

  /** Get current state */
  get status(): CircuitState {
    return this.state;
  }

  /** Get time until next attempt */
  get retryAfter(): number {
    return Math.max(0, this.nextAttempt - Date.now());
  }

  /** Execute operation with circuit protection */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (!this.canExecute) {
      throw new Error(`Circuit open. Retry after ${this.retryAfter}s`);
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    if (this.state === 'half-open') {
      this.successes++;
      if (this.successes >= this.options.successThreshold) {
        this.state = 'closed';
      }
    }
  }

  private onFailure(): void {
    this.failures++;
    if (this.state === 'half-open') {
      this.state = 'open';
      this.nextAttempt = Date.now() + this.options.resetTimeoutMs;
    } else if (this.failures >= this.options.failureThreshold) {
      this.state = 'open';
      this.nextAttempt = Date.now() + this.options.resetTimeoutMs;
    }
  }

  /** Reset circuit */
  reset(): void {
    this.state = 'closed';
    this.failures = 0;
    this.successes = 0;
    this.nextAttempt = 0;
  }
}