import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createApp, type AppDeps } from '../src/app.js';
import { createRateLimiter } from '../src/rate-limit.js';
import { TurnstileUnavailable } from '../src/turnstile.js';
import { MailFailed } from '../src/mailer.js';

const ORIGIN = 'https://brxsolutions.sk';
const valid = {
  name: 'Peter',
  email: 'peter@example.com',
  type: 'ai',
  message: 'Hello, I have a project for you.',
  lang: 'sk',
  website: '',
  'cf-turnstile-response': 'XXXX.DUMMY.TOKEN.XXXX',
};

let deps: AppDeps;
let mail: ReturnType<typeof vi.fn>;

beforeEach(() => {
  mail = vi.fn(async () => {});
  deps = {
    verify: vi.fn(async () => true),
    mail,
    limiter: createRateLimiter({ limit: 5, windowMs: 3_600_000 }),
    config: { siteOrigin: ORIGIN },
    log: () => {},
  };
});

const json = (body: unknown, headers: Record<string, string> = {}) =>
  createApp(deps).request('/api/contact', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: ORIGIN, ...headers },
    body: JSON.stringify(body),
  });

const form = (fields: Record<string, string>, headers: Record<string, string> = {}) =>
  createApp(deps).request('/api/contact', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', origin: ORIGIN, ...headers },
    body: new URLSearchParams(fields).toString(),
    redirect: 'manual',
  });

describe('POST /api/contact', () => {
  it('accepts JSON and sends the mail', async () => {
    const res = await json(valid);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(mail).toHaveBeenCalledTimes(1);
    expect(mail.mock.calls[0]?.[0]).toMatchObject({ input: { name: 'Peter' } });
  });

  it('redirects form posts to the localized sent page', async () => {
    const sk = await form(valid);
    expect(sk.status).toBe(303);
    expect(sk.headers.get('location')).toBe(`${ORIGIN}/sprava-odoslana/`);
    const en = await form({ ...valid, lang: 'en' });
    expect(en.headers.get('location')).toBe(`${ORIGIN}/en/message-sent/`);
  });

  it('rejects requests without a matching origin', async () => {
    const none = await createApp(deps).request('/api/contact', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(valid),
    });
    expect(none.status).toBe(403);
    expect((await json(valid, { origin: 'https://evil.example' })).status).toBe(403);
    const referer = await createApp(deps).request('/api/contact', {
      method: 'POST',
      headers: { 'content-type': 'application/json', referer: `${ORIGIN}/en/` },
      body: JSON.stringify(valid),
    });
    expect(referer.status).toBe(200);
  });

  it('answers 415 to an unsupported content type', async () => {
    const res = await createApp(deps).request('/api/contact', {
      method: 'POST',
      headers: { 'content-type': 'text/plain', origin: ORIGIN },
      body: 'hello',
    });
    expect(res.status).toBe(415);
    expect(mail).not.toHaveBeenCalled();
  });

  it('enforces the 32 KiB body limit but accepts a 5000-emoji message', async () => {
    const big = await json({ ...valid, message: 'a'.repeat(32 * 1024 + 1) });
    expect(big.status).toBe(413);
    const emoji = await json({ ...valid, message: '😀'.repeat(5000) });
    expect(emoji.status).toBe(200);
  });

  it('silently accepts a filled honeypot without sending mail', async () => {
    const res = await json({ ...valid, website: 'http://spam.example' });
    expect(res.status).toBe(200);
    expect(mail).not.toHaveBeenCalled();
    const f = await form({ ...valid, website: 'x' });
    expect(f.status).toBe(303);
  });

  it('rate-limits the sixth request from one IP', async () => {
    const app = createApp(deps);
    const post = () =>
      app.request('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: ORIGIN, 'cf-connecting-ip': '5.5.5.5' },
        body: JSON.stringify(valid),
      });
    for (let i = 0; i < 5; i++) expect((await post()).status).toBe(200);
    const sixth = await post();
    expect(sixth.status).toBe(429);
    expect(Number(sixth.headers.get('retry-after'))).toBeGreaterThan(0);
  });

  it('returns field errors for invalid JSON input', async () => {
    const res = await json({ ...valid, email: 'nope', message: 'short' });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { ok: boolean; errors: Record<string, string> };
    expect(body.ok).toBe(false);
    expect(Object.keys(body.errors).sort()).toEqual(['email', 'message']);
    expect(mail).not.toHaveBeenCalled();
  });

  it('redirects invalid form input to the failed page', async () => {
    const res = await form({ ...valid, email: 'nope' });
    expect(res.status).toBe(303);
    expect(res.headers.get('location')).toBe(`${ORIGIN}/sprava-neodoslana/`);
  });

  it('answers 400 when Turnstile rejects the token', async () => {
    deps.verify = vi.fn(async () => false);
    const res = await json(valid);
    expect(res.status).toBe(400);
    expect(((await res.json()) as { errors: Record<string, string> }).errors).toHaveProperty('turnstile');
    expect(mail).not.toHaveBeenCalled();
  });

  it('answers 502 when Turnstile is unavailable', async () => {
    deps.verify = vi.fn(async () => {
      throw new TurnstileUnavailable('down');
    });
    expect((await json(valid)).status).toBe(502);
  });

  it('answers 502 when mail delivery fails', async () => {
    mail.mockRejectedValueOnce(new MailFailed('boom'));
    const res = await json(valid);
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ ok: false, error: 'mail' });
  });

  it('handles CORS preflight for the site origin', async () => {
    const res = await createApp(deps).request('/api/contact', {
      method: 'OPTIONS',
      headers: { origin: ORIGIN, 'access-control-request-method': 'POST' },
    });
    expect(res.status).toBe(204);
    expect(res.headers.get('access-control-allow-origin')).toBe(ORIGIN);
  });

  it('exposes a health check', async () => {
    const res = await createApp(deps).request('/healthz');
    expect(res.status).toBe(200);
  });
});
