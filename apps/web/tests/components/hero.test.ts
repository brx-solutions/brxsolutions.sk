import { describe, it, expect } from 'vitest';
import Hero from '../../src/components/Hero.astro';
import { renderToHtml } from '../helpers/render';
import { company } from '../../src/config/company';

describe('Hero', () => {
  it('renders the title with preserved line breaks and both CTAs', async () => {
    const html = await renderToHtml(Hero, { locale: 'en' });
    expect(html).toMatch(
      /<h1[^>]*whitespace-pre-line[^>]*>AI &amp; back-end\nthat run\nand can be measured\.<\/h1>/,
    );
    expect(html).toContain('href="#kontakt"');
    expect(html).toContain('href="#projekty"');
  });

  it('fills the code window from company config and dictionary', async () => {
    const html = await renderToHtml(Hero, { locale: 'sk' });
    const q = (v: string) => `&quot;${v}&quot;`; // Astro escapes quotes in text nodes
    expect(html).toContain(q(company.name));
    expect(html).toContain(q(company.founder));
    expect(html).toContain(`since:   <span`);
    expect(html).toContain(`>${company.since}<`);
    expect(html).toContain(q('GenAI / RAG'));
  });
});
