import { describe, it, expect } from 'vitest';
import { createTurnstileVerifier, TurnstileUnavailable } from '../src/turnstile.js';

const stub = (body: unknown, status = 200) =>
  (async (_url: string | URL | Request, init?: RequestInit) => {
    (stub as unknown as { last?: RequestInit }).last = init;
    return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;

describe('createTurnstileVerifier', () => {
  it('returns true when siteverify succeeds', async () => {
    const verify = createTurnstileVerifier({ secret: 's', fetchImpl: stub({ success: true }) });
    await expect(verify('tok', '1.2.3.4')).resolves.toBe(true);
  });
  it('returns false when siteverify reports failure', async () => {
    const verify = createTurnstileVerifier({ secret: 's', fetchImpl: stub({ success: false, 'error-codes': ['invalid-input-response'] }) });
    await expect(verify('tok', undefined)).resolves.toBe(false);
  });
  it('sends secret, response and remoteip form-encoded', async () => {
    const calls: RequestInit[] = [];
    const fetchImpl = (async (_u: string | URL | Request, init?: RequestInit) => {
      calls.push(init!);
      return new Response('{"success":true}');
    }) as typeof fetch;
    await createTurnstileVerifier({ secret: 'SECRET', fetchImpl })('TOKEN', '9.9.9.9');
    const body = String(calls[0]?.body);
    expect(body).toContain('secret=SECRET');
    expect(body).toContain('response=TOKEN');
    expect(body).toContain('remoteip=9.9.9.9');
  });
  it('throws TurnstileUnavailable on network error', async () => {
    const fetchImpl = (async () => {
      throw new Error('ECONNRESET');
    }) as typeof fetch;
    await expect(createTurnstileVerifier({ secret: 's', fetchImpl })('t', undefined)).rejects.toBeInstanceOf(TurnstileUnavailable);
  });
  it('throws TurnstileUnavailable on a non-2xx response', async () => {
    const verify = createTurnstileVerifier({ secret: 's', fetchImpl: stub({}, 503) });
    await expect(verify('t', undefined)).rejects.toBeInstanceOf(TurnstileUnavailable);
  });
  it('throws TurnstileUnavailable on timeout', async () => {
    const fetchImpl = ((_u: unknown, init?: RequestInit) =>
      new Promise<Response>((_, reject) => init?.signal?.addEventListener('abort', () => reject(new Error('aborted'))))) as typeof fetch;
    const verify = createTurnstileVerifier({ secret: 's', fetchImpl, timeoutMs: 10 });
    await expect(verify('t', undefined)).rejects.toBeInstanceOf(TurnstileUnavailable);
  });
});
