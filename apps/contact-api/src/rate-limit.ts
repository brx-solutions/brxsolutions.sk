export interface RateLimiter {
  hit(key: string): { allowed: boolean; retryAfterSec: number };
}

/** Sliding-window limiter kept in memory. One process, one window per key. */
export function createRateLimiter(opts: {
  limit: number;
  windowMs: number;
  now?: () => number;
}): RateLimiter {
  const { limit, windowMs, now = Date.now } = opts;
  const hits = new Map<string, number[]>();
  return {
    hit(key) {
      const t = now();
      const cutoff = t - windowMs;
      for (const [k, times] of hits) {
        const fresh = times.filter((x) => x > cutoff);
        if (fresh.length === 0) hits.delete(k);
        else hits.set(k, fresh);
      }
      const times = hits.get(key) ?? [];
      if (times.length >= limit) {
        const oldest = times[0] ?? t;
        return {
          allowed: false,
          retryAfterSec: Math.max(1, Math.ceil((oldest + windowMs - t) / 1000)),
        };
      }
      times.push(t);
      hits.set(key, times);
      return { allowed: true, retryAfterSec: 0 };
    },
  };
}
