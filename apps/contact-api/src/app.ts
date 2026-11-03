import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { cors } from 'hono/cors';
import { contactSchema, type ContactInput } from './schema.js';
import type { Config } from './config.js';
import type { Mailer } from './mailer.js';
import type { RateLimiter } from './rate-limit.js';
import type { TurnstileVerifier } from './turnstile.js';
import { MailFailed, TurnstileUnavailable } from './errors.js';

export interface AppDeps {
  verify: TurnstileVerifier;
  mail: Mailer;
  limiter: RateLimiter;
  config: Pick<Config, 'siteOrigin'>;
  log?: (event: Record<string, unknown>) => void;
}

const BODY_LIMIT = 32 * 1024;
const SENT_PATH = { sk: '/sprava-odoslana/', en: '/en/message-sent/' } as const;
const FAILED_PATH = { sk: '/sprava-neodoslana/', en: '/en/message-failed/' } as const;

type Lang = keyof typeof SENT_PATH;
const asLang = (v: unknown): Lang => (v === 'en' ? 'en' : 'sk');

export function createApp(deps: AppDeps): Hono {
  const { siteOrigin } = deps.config;
  const log = deps.log ?? ((e) => process.stdout.write(JSON.stringify(e) + '\n'));
  const app = new Hono();

  app.get('/healthz', (c) => c.text('ok'));

  app.use(
    '/api/contact',
    cors({
      origin: siteOrigin,
      allowMethods: ['POST', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Accept'],
    }),
  );

  app.post('/api/contact', bodyLimit({ maxSize: BODY_LIMIT }), async (c) => {
    const ip = c.req.header('cf-connecting-ip');
    const contentType = (c.req.header('content-type') ?? '').split(';')[0]?.trim().toLowerCase();
    const isForm =
      contentType === 'application/x-www-form-urlencoded' || contentType === 'multipart/form-data';
    const isJson = contentType === 'application/json';
    if (!isForm && !isJson) return c.json({ ok: false, error: 'unsupported_media_type' }, 415);

    const origin = c.req.header('origin');
    const referer = c.req.header('referer');
    const sameOrigin = origin
      ? origin === siteOrigin
      : !!referer && referer.startsWith(siteOrigin + '/');
    if (!sameOrigin) {
      log({ event: 'contact', status: 403, ip });
      return c.json({ ok: false, error: 'forbidden' }, 403);
    }

    let raw: Record<string, unknown>;
    try {
      raw = isJson
        ? ((await c.req.json()) as Record<string, unknown>)
        : ((await c.req.parseBody()) as Record<string, unknown>);
    } catch {
      return c.json({ ok: false, error: 'bad_request' }, 400);
    }
    const lang = asLang(raw['lang']);
    const redirectTo = (path: string) => c.redirect(siteOrigin + path, 303);
    const fail = (
      status: 400 | 429 | 502,
      body: Record<string, unknown>,
      headers?: Record<string, string>,
    ) => {
      log({ event: 'contact', status, type: raw['type'], lang, ip });
      if (isForm) return redirectTo(FAILED_PATH[lang]);
      return c.json({ ok: false, ...body }, status, headers);
    };

    // Honeypot: bots fill every field. Pretend success, send nothing.
    if (typeof raw['website'] === 'string' && raw['website'].length > 0) {
      log({ event: 'honeypot', ip });
      return isForm ? redirectTo(SENT_PATH[lang]) : c.json({ ok: true });
    }

    const limit = deps.limiter.hit(ip ?? 'unknown');
    if (!limit.allowed)
      return fail(429, { error: 'rate_limited' }, { 'Retry-After': String(limit.retryAfterSec) });

    const parsed = contactSchema.safeParse(raw);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues)
        errors[String(issue.path[0] ?? 'form')] = issue.message;
      return fail(400, { errors });
    }
    const input: ContactInput = parsed.data;

    try {
      const human = await deps.verify(input['cf-turnstile-response'], ip);
      if (!human) return fail(400, { errors: { turnstile: 'failed' } });
    } catch (err) {
      if (err instanceof TurnstileUnavailable) return fail(502, { error: 'turnstile' });
      throw err;
    }

    try {
      await deps.mail({ input, ip, receivedAt: new Date() });
    } catch (err) {
      if (err instanceof MailFailed) return fail(502, { error: 'mail' });
      throw err;
    }

    log({ event: 'contact', status: 200, type: input.type, lang, ip });
    return isForm ? redirectTo(SENT_PATH[lang]) : c.json({ ok: true });
  });

  return app;
}
