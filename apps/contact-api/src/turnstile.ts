const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export class TurnstileUnavailable extends Error {
  constructor(cause: unknown) {
    super('Turnstile siteverify unavailable');
    this.name = 'TurnstileUnavailable';
    this.cause = cause;
  }
}

export type TurnstileVerifier = (token: string, remoteIp: string | undefined) => Promise<boolean>;

export function createTurnstileVerifier(opts: {
  secret: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}): TurnstileVerifier {
  const { secret, fetchImpl = fetch, timeoutMs = 5000 } = opts;
  return async (token, remoteIp) => {
    const body = new URLSearchParams({ secret, response: token });
    if (remoteIp) body.set('remoteip', remoteIp);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetchImpl(SITEVERIFY, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body,
        signal: controller.signal,
      });
      if (!res.ok) throw new TurnstileUnavailable(`status ${res.status}`);
      const json = (await res.json()) as { success?: unknown };
      return json.success === true;
    } catch (err) {
      if (err instanceof TurnstileUnavailable) throw err;
      throw new TurnstileUnavailable(err);
    } finally {
      clearTimeout(timer);
    }
  };
}
