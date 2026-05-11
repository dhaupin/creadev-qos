/**
 * ============================================================================
 * Timeout Utilities
 * ============================================================================
 * 
 * PURPOSE:
 * Timeout wrapper for async operations.
 * 
 * USAGE:
 * ```typescript
 * import { withTimeout, timeoutSignal } from '@creadev.org/qos/timeout';
 * 
 * // With timeout
 * const result = await withTimeout(fetchData(), { ms: 5000 });
 * 
 * // AbortController for fetch
 * const signal = timeoutSignal(5000);
 * fetch(url, { signal });
 * ```
 * 
 * ============================================================================
 */

export interface TimeoutOptions {
  /** Timeout in ms (default: 30000) */
  ms?: number;
  /** Custom error message */
  message?: string;
}

/** Create AbortSignal with timeout */
export function timeoutSignal(ms: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

/** Execute function with timeout */
export async function withTimeout<T>(
  operation: () => Promise<T>,
  options: TimeoutOptions = {}
): Promise<T> {
  const ms = options.ms ?? 30000;
  const message = options.message ?? `Operation timed out after ${ms}ms`;
  
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  let settled = false;
  
  const racePromise = Promise.race([
    operation(),
    new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(() => {
        settled = true;
        reject(new Error(message));
      }, ms);
    }),
  ]);

  try {
    return await racePromise;
  } finally {
    if (!settled && timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}

/** Wrapper for fetch with timeout */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeoutMs?: number } = {}
): Promise<Response> {
  const { timeoutMs = 30000, ...fetchOptions } = options;
  const controller = new AbortController();
  
  const fetchPromise = fetch(url, {
    ...fetchOptions,
    signal: controller.signal,
  });
  
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    return await fetchPromise;
  } finally {
    clearTimeout(timeoutHandle);
  }
}