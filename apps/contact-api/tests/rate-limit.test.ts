import { describe, it, expect } from 'vitest';
import { createRateLimiter } from '../src/rate-limit.js';

describe('createRateLimiter', () => {
  it('allows five hits and denies the sixth with a retry hint', () => {
    let now = 1_000_000;
    const limiter = createRateLimiter({ limit: 5, windowMs: 3_600_000, now: () => now });
    for (let i = 0; i < 5; i++) expect(limiter.hit('ip').allowed).toBe(true);
    const sixth = limiter.hit('ip');
    expect(sixth.allowed).toBe(false);
    expect(sixth.retryAfterSec).toBeGreaterThan(0);
    expect(sixth.retryAfterSec).toBeLessThanOrEqual(3600);
  });
  it('allows again once the window has passed', () => {
    let now = 0;
    const limiter = createRateLimiter({ limit: 2, windowMs: 1000, now: () => now });
    limiter.hit('ip');
    limiter.hit('ip');
    expect(limiter.hit('ip').allowed).toBe(false);
    now = 1001;
    expect(limiter.hit('ip').allowed).toBe(true);
  });
  it('tracks keys independently', () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000, now: () => 0 });
    expect(limiter.hit('a').allowed).toBe(true);
    expect(limiter.hit('b').allowed).toBe(true);
    expect(limiter.hit('a').allowed).toBe(false);
  });
});
