export interface Config {
  port: number;
  siteOrigin: string;
  contactTo: string;
  contactFrom: string;
  turnstileSecret: string;
  resendApiKey?: string;
  mailTransport: 'resend' | 'console';
  rateLimitPerHour: number;
}

export function loadConfig(env: NodeJS.ProcessEnv): Config {
  const missing: string[] = [];
  const need = (key: string): string => {
    const v = env[key];
    if (!v) missing.push(key);
    return v ?? '';
  };
  const siteOrigin = need('SITE_ORIGIN');
  const contactTo = need('CONTACT_TO');
  const contactFrom = need('CONTACT_FROM');
  const turnstileSecret = need('TURNSTILE_SECRET_KEY');
  const transport = env['MAIL_TRANSPORT'] ?? 'resend';
  if (transport !== 'resend' && transport !== 'console') {
    throw new Error(`MAIL_TRANSPORT must be "resend" or "console", got "${transport}"`);
  }
  const resendApiKey = env['RESEND_API_KEY'];
  if (transport === 'resend' && !resendApiKey) missing.push('RESEND_API_KEY');
  if (missing.length)
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  if (!/^https?:\/\/[^/]+$/.test(siteOrigin)) {
    throw new Error(
      `SITE_ORIGIN must be an origin without a path or trailing slash, got "${siteOrigin}"`,
    );
  }
  const port = Number(env['PORT'] ?? 3000);
  if (!Number.isInteger(port) || port <= 0)
    throw new Error(`PORT must be a positive integer, got "${env['PORT']}"`);
  const rateLimitPerHour = Number(env['RATE_LIMIT_PER_HOUR'] ?? 5);
  if (!Number.isInteger(rateLimitPerHour) || rateLimitPerHour <= 0) {
    throw new Error(
      `RATE_LIMIT_PER_HOUR must be a positive integer, got "${env['RATE_LIMIT_PER_HOUR']}"`,
    );
  }
  return {
    port,
    siteOrigin,
    contactTo,
    contactFrom,
    turnstileSecret,
    resendApiKey,
    mailTransport: transport,
    rateLimitPerHour,
  };
}
