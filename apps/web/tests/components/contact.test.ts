import { describe, it, expect } from 'vitest';
import Contact from '../../src/components/Contact.astro';
import { renderToHtml } from '../helpers/render';
import { company } from '../../src/config/company';

describe('Contact', () => {
  it('shows the configured email and a form with the API field names', async () => {
    const html = await renderToHtml(Contact, { locale: 'sk' });
    expect(html).toContain('id="kontakt"');
    expect(html).toContain(`href="mailto:${company.email}"`);
    expect(html).toMatch(
      /<form[^>]*method="post"[^>]*action="\/api\/contact"[^>]*data-contact-form/,
    );
    for (const name of [
      'name',
      'email',
      'type',
      'message',
      'website',
      'lang',
      'cf-turnstile-response',
    ]) {
      expect(html, name).toMatch(new RegExp(`name="${name}"`));
    }
    expect(html).toMatch(/<input[^>]*name="lang"[^>]*value="sk"/);
  });

  it('offers the four project types in order and links the consent note to the privacy page', async () => {
    const html = await renderToHtml(Contact, { locale: 'sk' });
    const values = [...html.matchAll(/<option value="([a-z]+)"/g)].map((m) => m[1]);
    expect(values).toEqual(['ai', 'backend', 'audit', 'cv']);
    expect(html).toContain('href="/ochrana-osobnych-udajov/"');
    expect(html).toContain('data-sitekey="1x00000000000000000000AA"');
    // Widget stays invisible unless Cloudflare needs an interactive check.
    expect(html).toMatch(/<div class="cf-turnstile"[^>]*data-appearance="interaction-only"/);
    expect(html).toContain('challenges.cloudflare.com/turnstile/v0/api.js');
  });
});
