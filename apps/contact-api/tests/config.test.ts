import { describe, it, expect } from 'vitest';
import { loadConfig } from '../src/config.js';

const base = {
  SITE_ORIGIN: 'https://brxsolutions.sk',
  CONTACT_TO: 'me@example.com',
  CONTACT_FROM: 'web@brxsolutions.sk',
  TURNSTILE_SECRET_KEY: 'secret',
};

describe('loadConfig', () => {
  it('names a missing required variable', () => {
    const { TURNSTILE_SECRET_KEY: _t, ...env } = base;
    expect(() => loadConfig(env)).toThrow(/TURNSTILE_SECRET_KEY/);
  });
  it('does not require RESEND_API_KEY for the console transport', () => {
    const cfg = loadConfig({ ...base, MAIL_TRANSPORT: 'console' });
    expect(cfg.mailTransport).toBe('console');
    expect(cfg.port).toBe(3000);
  });
  it('requires RESEND_API_KEY for the resend transport', () => {
    expect(() => loadConfig({ ...base, MAIL_TRANSPORT: 'resend' })).toThrow(/RESEND_API_KEY/);
    expect(loadConfig({ ...base, MAIL_TRANSPORT: 'resend', RESEND_API_KEY: 'k', PORT: '4000' }).port).toBe(4000);
  });
  it('rejects an unknown transport and a SITE_ORIGIN with a trailing slash', () => {
    expect(() => loadConfig({ ...base, MAIL_TRANSPORT: 'smtp' })).toThrow(/MAIL_TRANSPORT/);
    expect(() => loadConfig({ ...base, MAIL_TRANSPORT: 'console', SITE_ORIGIN: 'https://brxsolutions.sk/' })).toThrow(/SITE_ORIGIN/);
  });
});
