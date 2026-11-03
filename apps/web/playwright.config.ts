import { defineConfig, devices } from '@playwright/test';

const PORT = 4321;
const API_PORT = 3777; // not 3000: commonly taken by other dev servers

// The site is built once in global-setup with the e2e contact endpoint baked in.
process.env.PUBLIC_CONTACT_ENDPOINT = `http://localhost:${API_PORT}/api/contact`;
process.env.PUBLIC_TURNSTILE_SITE_KEY = '1x00000000000000000000AA';

export default defineConfig({
  testDir: 'e2e',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: `http://localhost:${PORT}`, trace: 'retain-on-failure' },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'], viewport: { width: 375, height: 812 }, isMobile: true },
    },
  ],
  webServer: [
    {
      command: `node node_modules/astro/bin/astro.mjs preview --port ${PORT} --ignore-lock`,
      url: `http://localhost:${PORT}/`,
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: `node ../contact-api/node_modules/tsx/dist/cli.mjs ../contact-api/src/server.ts`,
      url: `http://localhost:${API_PORT}/healthz`,
      reuseExistingServer: false,
      timeout: 60_000,
      env: {
        PORT: String(API_PORT),
        SITE_ORIGIN: `http://localhost:${PORT}`,
        CONTACT_TO: 'peter.beraxa@gmail.com',
        CONTACT_FROM: 'onboarding@resend.dev',
        TURNSTILE_SECRET_KEY: '1x0000000000000000000000000000000AA',
        MAIL_TRANSPORT: 'console',
        RATE_LIMIT_PER_HOUR: '1000', // every spec run submits from one 'unknown' IP
      },
    },
  ],
});
