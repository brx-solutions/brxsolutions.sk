import { describe, it, expect } from 'vitest';
import Header from '../../src/components/Header.astro';
import { renderToHtml } from '../helpers/render';

describe('Header', () => {
  it('links to the six sections with locale labels and a mobile menu button', async () => {
    const html = await renderToHtml(Header, { locale: 'en' });
    for (const a of ['sluzby', 'stack', 'skusenosti', 'projekty', 'vlastne', 'kontakt']) {
      expect(html).toContain(`href="#${a}"`);
    }
    expect(html).toMatch(/>\s*Services\s*</);
    expect(html).toMatch(/>\s*Case studies\s*</);
    expect(html).toContain('Free consultation');
    expect(html).toMatch(/<button[^>]*aria-controls="main-nav"[^>]*aria-expanded="false"/);
  });

  it('renders the language switch pointing at both locale homes', async () => {
    const html = await renderToHtml(Header, { locale: 'en' });
    expect(html).toMatch(/<a[^>]*href="\/"[^>]*hreflang="sk"[^>]*data-lang-switch/);
    expect(html).toMatch(
      /<a[^>]*href="\/en\/"[^>]*hreflang="en"[^>]*data-lang-switch[^>]*aria-current="true"/,
    );
  });
});
