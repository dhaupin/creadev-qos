# @creadev.org/qos

> Quality of Service utilities - retry, timeout, circuit breaker, throttler, bulkhead.

[![npm](https://img.shields.io/npm/v/@creadev.org/qos)](https://www.npmjs.com/package/@creadev.org/qos)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Install

```bash
npm install @creadev.org/qos
```

## Usage

### Retry with Backoff

```typescript
import { withRetry } from '@creadev.org/qos';

// Retry with automatic backoff
const result = await withRetry(fetchData(), { 
  retries: 3,
  backoff: 'exponential'
});
```

### Circuit Breaker

```typescript
import { CircuitBreaker } from '@creadev.org/qos';

const breaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeoutMs: 30000
});

try {
  const result = await breaker.execute(() => apiCall());
} catch (err) {
  // Circuit open - failures threshold reached
}
```

### Throttler (from vant)

```typescript
import { Throttler } from '@creadev.org/qos';

// Throttle to max 10 calls per second
const t = new Throttler({ limit: 10, window: 1000 });
const throttledFn = t.throttle(() => doWork());
// Excess calls are silently dropped
```

### Bulkhead (from vant)

```typescript
import { Bulkhead } from '@creadev.org/qos';

// Max 5 concurrent
const b = new Bulkhead({ concurrency: 5 });
await b.run(() => apiCall()); // Queued if at limit
```

### Timeout

```typescript
import { withTimeout } from '@creadev.org/qos';

// Auto-timeout with rejection
const result = await withTimeout(fetchData(), { ms: 5000 });
```

## API

### withRetry

| Option | Type | Default | Description |
|--------|------|---------|--------------|
| `retries` | `number` | `3` | Number of retry attempts |
| `backoff` | `'fixed'` \| `'exponential'` | `'exponential'` | Backoff strategy |
| `baseDelayMs` | `number` | `1000` | Base delay |

### CircuitBreaker

| Method | Description |
|--------|-------------|
| `breaker.execute(fn)` | Execute function, respects circuit state |
| `breaker.status` | `'closed' | 'open' | 'half-open'` |

### Throttler

| Method | Description |
|--------|-------------|
| `new Throttler(opts)` | Create with `limit`, `window` ms |
| `t.throttle(fn)` | Wrap function, drops excess calls |
| `t.clear()` | Clear all tracked calls |
| `t.stats()` | Get `{ tracked, uptime }` |

### Bulkhead

| Method | Description |
|--------|-------------|
| `new Bulkhead(opts)` | Create with `concurrency` |
| `b.run(fn)` | Execute, queue if at limit |
| `b.isFull()` | Check if at capacity |
| `b.getStatus()` | Get `{ running, queued, uptime }` |

### withTimeout

| Option | Type | Description |
|--------|------|--------------|
| `ms` | `number` | Timeout in milliseconds |

## License

MIT
retry
#Mon May 11 15:26:44 UTC 2026
