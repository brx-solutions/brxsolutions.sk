import { describe, it, expect } from 'vitest';
import Terminal from '../../src/components/Terminal.astro';
import Home from '../../src/components/Home.astro';
import { renderToHtml } from '../helpers/render';
import { SCENE_IDS } from '../../src/terminal/types';
import { t } from '../../src/i18n';

const count = (s: string, re: RegExp) => (s.match(re) ?? []).length;
const decode = (s: string) =>
  s
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

describe('Terminal', () => {
  it('renders the window with labelled controls, a dock and scene data', async () => {
    const html = await renderToHtml(Terminal, { locale: 'sk' });
    for (const hook of [
      'data-term-window',
      'data-term-close',
      'data-term-min',
      'data-term-max',
      'data-term-file',
      'data-term-count',
      'data-term-body',
      'data-term-cap',
      'data-term-prev',
      'data-term-next',
      'data-term-detail',
      'data-term-stat',
      'data-term-dock',
      'data-term-dock-label',
    ])
      expect(html, hook).toContain(hook);
    const l = t('sk').terminal;
    for (const label of [l.aside, l.close, l.minimize, l.maximize, l.prev, l.next])
      expect(html).toContain(`aria-label="${label}"`);
    // The dock shows the file name, so its purpose is visually hidden text, not an aria-label
    // that would hide the visible name from assistive tech.
    expect(html).toMatch(new RegExp(`data-term-dock[^>]*>[\\s\\S]*sr-only[^>]*>${l.dock}:`));
    expect(html).not.toMatch(/data-term-dock\b[^>]*aria-label/);
    const data = JSON.parse(decode(/data-terminal="([^"]*)"/.exec(html)![1]!));
    expect(data.tests).toHaveLength(4);
    expect(data.labels.close).toBe(l.close);
  });

  it('carries no inline style or script (production CSP)', async () => {
    const html = await renderToHtml(Terminal, { locale: 'en' });
    expect(html).not.toMatch(/\sstyle=/);
    expect(html).not.toMatch(/<script\b(?![^>]*\bsrc=)/);
  });

  it('uses the locale for labels', async () => {
    const html = await renderToHtml(Terminal, { locale: 'en' });
    expect(html).toContain(`aria-label="${t('en').terminal.close}"`);
    expect(html).not.toContain(t('sk').terminal.close);
  });
});

describe('Home scene markers', () => {
  it('marks ten scenes in page order', async () => {
    const html = await renderToHtml(Home, { locale: 'sk' });
    expect([...html.matchAll(/data-scene="([a-z]+)"/g)].map((m) => m[1])).toEqual([...SCENE_IDS]);
  });

  it('wraps the content and the window in one shell', async () => {
    const html = await renderToHtml(Home, { locale: 'sk' });
    expect(html).toMatch(/data-term-shell[^>]*>\s*<main[^>]*data-term-content/);
    expect(html.indexOf('data-term-window')).toBeGreaterThan(html.indexOf('</main>'));
    expect(html.indexOf('<footer')).toBeGreaterThan(html.indexOf('data-term-dock'));
  });

  it('project and own cards expose their slug for the detail view', async () => {
    const html = await renderToHtml(Home, { locale: 'en' });
    for (const slug of ['rag', 'migration', 'football', 'rpd', 'agents', 'acc', 'ha'])
      expect(html, slug).toContain(`data-scene-item="${slug}"`);
  });

  it('marks one item per service, stack group and process step', async () => {
    const html = await renderToHtml(Home, { locale: 'sk' });
    const d = t('sk');
    const expected =
      1 + d.services.items.length + d.stack.groups.length + d.process.steps.length + 4 + 3;
    expect(count(html, /data-scene-item/g)).toBe(expected);
  });

  it('keeps the static profile card for visitors without JavaScript', async () => {
    const html = await renderToHtml(Home, { locale: 'sk' });
    expect(count(html, /data-hero-code/g)).toBe(1);
  });

  it('sizes the content by its own width, not the viewport', async () => {
    // With the window open the content column is narrower than the viewport, so layout
    // breakpoints inside <main> must be container queries.
    const html = await renderToHtml(Home, { locale: 'sk' });
    const main = /<main[^>]*>[\s\S]*<\/main>/.exec(html)![0];
    expect(main).toMatch(/^<main[^>]*class="[^"]*@container/);
    expect(main.match(/[\s"](?:sm|md|lg|xl):[\w[\]().%-]+/g) ?? []).toEqual([]);
  });
});
