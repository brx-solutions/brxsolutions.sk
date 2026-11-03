import { serve } from '@hono/node-server';
import { createApp } from './app.js';
import { loadConfig } from './config.js';
import { createConsoleMailer, createResendMailer } from './mailer.js';
import { createRateLimiter } from './rate-limit.js';
import { createTurnstileVerifier } from './turnstile.js';

const config = loadConfig(process.env);

const app = createApp({
  verify: createTurnstileVerifier({ secret: config.turnstileSecret }),
  mail:
    config.mailTransport === 'console'
      ? createConsoleMailer()
      : createResendMailer({
          apiKey: config.resendApiKey!,
          from: config.contactFrom,
          to: config.contactTo,
        }),
  limiter: createRateLimiter({ limit: 5, windowMs: 60 * 60 * 1000 }),
  config,
});

serve({ fetch: app.fetch, port: config.port }, (info) => {
  process.stdout.write(
    JSON.stringify({ event: 'listening', port: info.port, transport: config.mailTransport }) + '\n',
  );
});
