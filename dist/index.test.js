import { describe, it, expect, beforeEach } from 'vitest';
import { withRetry, CircuitBreaker, calculateDelay, withTimeout } from '../src/index';
describe('calculateDelay', () => {
    it('calculates exponential backoff', () => {
        expect(calculateDelay(0, 1000, 30000, 2, false)).toBe(1000);
        expect(calculateDelay(1, 1000, 30000, 2, false)).toBe(2000);
        expect(calculateDelay(2, 1000, 30000, 2, false)).toBe(4000);
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
            if (attempts < 3)
                throw new Error('network');
            return Promise.resolve('ok');
        }, { retries: 3, baseDelayMs: 10 });
        expect(result).toBe('ok');
    });
    it('throws after max retries', async () => {
        await expect(withRetry(() => Promise.reject(new Error('fail')), { retries: 2, baseDelayMs: 10 })).rejects.toThrow();
    });
});
describe('CircuitBreaker', () => {
    let breaker;
    beforeEach(() => {
        breaker = new CircuitBreaker({ failureThreshold: 2, resetTimeoutMs: 500 });
    });
    it('starts closed', () => {
        expect(breaker.status).toBe('closed');
    });
    it('opens after failures', async () => {
        try {
            await breaker.execute(() => Promise.reject(new Error('fail')));
        }
        catch { }
        try {
            await breaker.execute(() => Promise.reject(new Error('fail')));
        }
        catch { }
        expect(breaker.status).toBe('open');
    });
    it('resets', () => {
        breaker.reset();
        expect(breaker.status).toBe('closed');
    });
});
describe('withTimeout', () => {
    it('resolves on success', async () => {
        const result = await withTimeout(() => Promise.resolve('ok'), { ms: 100 });
        expect(result).toBe('ok');
    });
    it('rejects on timeout', async () => {
        await expect(withTimeout(() => new Promise(r => setTimeout(r, 200)), { ms: 50 })).rejects.toThrow();
    });
});
