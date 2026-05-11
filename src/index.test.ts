import { describe, it, expect, beforeEach } from 'vitest';
import { withRetry, CircuitBreaker, calculateDelay, withTimeout, Throttler, Bulkhead } from '../src/index';

describe('calculateDelay', () => {
  it('calculates exponential backoff', () => {
    expect(calculateDelay(0, 1000, 30000, 2, false)).toBe(1000);
    expect(calculateDelay(1, 1000, 30000, 2, false)).toBe(2000);
  });

  it('caps at max', () => {
    expect(calculateDelay(10, 1000, 5000, 2, false)).toBe(5000);
  });
});

describe('withRetry', () => {
  it('succeeds on first try', async () => {
    const result = await withRetry(() => Promise.resolve('success'));
    expect(result).toBe('success');
  });

  it('retries on network errors', async () => {
    let attempts = 0;
    const result = await withRetry(() => {
      attempts++;
      if (attempts < 3) throw new Error('network');
      return Promise.resolve('ok');
    }, { retries: 3, baseDelayMs: 10 });
    expect(result).toBe('ok');
  });
});

describe('CircuitBreaker', () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    breaker = new CircuitBreaker({ failureThreshold: 2, resetTimeoutMs: 500 });
  });

  it('starts closed', () => {
    expect(breaker.status).toBe('closed');
  });

  it('opens after failures', async () => {
    await expect(breaker.execute(() => Promise.reject(new Error('fail')))).rejects.toThrow();
    await expect(breaker.execute(() => Promise.reject(new Error('fail')))).rejects.toThrow();
    expect(breaker.status).toBe('open');
  });
});

describe('withTimeout', () => {
  it('resolves within timeout', async () => {
    const result = await withTimeout(async () => 'ok', { ms: 100 });
    expect(result).toBe('ok');
  });

  it('rejects on timeout', async () => {
    await expect(
      withTimeout(async () => new Promise(r => setTimeout(() => r('ok'), 200)), { ms: 50 })
    ).rejects.toThrow();
  });
});

describe('Throttler', () => {
  it('should throttle function calls', () => {
    const t = new Throttler({ limit: 2, window: 100 });
    let count = 0;
    const fn = t.throttle(() => count++);
    fn(); fn(); fn();
    expect(count).toBe(2);
  });

  it('should clear', () => {
    const t = new Throttler();
    t.clear();
    expect(t.stats().tracked).toBe(0);
  });
});

describe('Bulkhead', () => {
  it('should check isFull', async () => {
    const b = new Bulkhead({ concurrency: 1 });
    b.run(async () => {
      await new Promise(r => setTimeout(r, 50));
      return 'done';
    });
    expect(b.isFull()).toBe(true);
  });

  it('should get status', () => {
    const b = new Bulkhead({ concurrency: 5 });
    const status = b.getStatus();
    expect(status.running).toBe(0);
    expect(status.queued).toBe(0);
  });
});
