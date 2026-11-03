import { describe, it, expect } from 'vitest';
import Base from '../src/layouts/Base.astro';
import { renderToHtml } from './helpers/render';

const props = { locale: 'en', title: 'T', description: 'D', alternates: { sk: '/', en: '/en/' } };

describe('Base layout', () => {
  it('renders lang, hreflang alternates and Organization JSON-LD', async () => {
    const html = await renderToHtml(Base, props, { default: '<main>x</main>' });
    expect(html).toContain('<html lang="en"');
    expect(html).toContain('hreflang="sk" href="https://brxsolutions.sk/"');
    expect(html).toContain('hreflang="en" href="https://brxsolutions.sk/en/"');
    expect(html).toContain('"@type":"Organization"');
    expect(html).toContain('"addressLocality":"Bytča"');
    expect(html).toContain('<main>x</main>');
  });

  it('does not load fonts from Google', async () => {
    const html = await renderToHtml(Base, props);
    expect(html).not.toContain('fonts.googleapis.com');
  });

  it('omits the analytics script when PUBLIC_UMAMI_* is unset', async () => {
    const html = await renderToHtml(Base, props);
    expect(html).not.toContain('data-website-id');
  });
});
