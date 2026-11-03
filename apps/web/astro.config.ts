import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://brxsolutions.sk',
  output: 'static',
  // One cache dir for build, sync and vitest so tests see the content data store.
  cacheDir: './.astro/',
  trailingSlash: 'always',
  compressHTML: true,
  build: { inlineStylesheets: 'never' },
  i18n: {
    defaultLocale: 'sk',
    locales: ['sk', 'en'],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [sitemap({ i18n: { defaultLocale: 'sk', locales: { sk: 'sk-SK', en: 'en' } } })],
  vite: {
    plugins: [tailwindcss()],
    // Never inline scripts: the production CSP has no 'unsafe-inline' for script-src.
    build: { assetsInlineLimit: 0 },
  },
});
