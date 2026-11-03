import { describe, it, expect } from 'vitest';
import Services from '../../src/components/Services.astro';
import Stack from '../../src/components/Stack.astro';
import Experience from '../../src/components/Experience.astro';
import Projects from '../../src/components/Projects.astro';
import Own from '../../src/components/Own.astro';
import Process from '../../src/components/Process.astro';
import Strengths from '../../src/components/Strengths.astro';
import { renderToHtml } from '../helpers/render';

const count = (html: string, re: RegExp) => (html.match(re) ?? []).length;

describe('Services', () => {
  it('renders the featured card spanning two columns plus three service cards', async () => {
    const html = await renderToHtml(Services, { locale: 'sk' });
    expect(html).toContain('id="sluzby"');
    expect(html).toContain('hlavná špecializácia');
    expect(html).toMatch(/<article[^>]*col-span-2/);
    expect(count(html, /<article/g)).toBe(4);
    expect(html).toContain('RAG · pgvector');
    expect(html).toContain('Fastify · Flask');
  });
});

describe('Stack', () => {
  it('renders four groups with counts and data-driven bar widths', async () => {
    const html = await renderToHtml(Stack, { locale: 'sk' });
    expect(html).toContain('id="stack"');
    expect(count(html, /<h3/g)).toBe(4);
    for (const w of ['95%', '88%', '80%', '85%']) expect(html).toContain(`style="width: ${w}"`);
    expect(html).toContain('8 nástrojov');
    expect(html).toContain('Cloudflare Zero Trust');
  });
});

describe('Experience', () => {
  it('renders five entries in order with the CV request link', async () => {
    const html = await renderToHtml(Experience, { locale: 'sk' });
    expect(html).toContain('id="skusenosti"');
    expect(count(html, /<li/g)).toBe(5);
    expect(html.indexOf('[2025] – teraz')).toBeLessThan(html.indexOf('2017 – 2019'));
    expect(html).toMatch(/<a[^>]*href="#kontakt"[^>]*data-cv-request/);
    expect(html).toContain('Vyžiadať si CV');
    expect(html).toContain('Certifikácia ScrumDesk');
  });
});

describe('Projects', () => {
  it('renders four case studies with metrics and native details', async () => {
    const html = await renderToHtml(Projects, { locale: 'sk' });
    expect(html).toContain('id="projekty"');
    expect(count(html, /<details/g)).toBe(4);
    expect(count(html, /<summary/g)).toBe(4);
    expect(html).toContain('Ako som to riešil');
    expect(html).toContain('Skryť detail');
    expect(html).toContain('3,5 min → 20 s');
    expect(html).toContain('odozva najpomalšieho RAG dotazu');
    expect(html).toContain('podliehajú NDA');
  });
});

describe('Own', () => {
  it('renders three own projects with icons and details', async () => {
    const html = await renderToHtml(Own, { locale: 'sk' });
    expect(html).toContain('id="vlastne"');
    expect(count(html, /<details/g)).toBe(3);
    expect(html).toContain('Technické detaily');
    expect(html).toContain('222 testov · v produkcii');
    expect(count(html, /<svg/g)).toBeGreaterThanOrEqual(3);
  });
});

describe('Process and Strengths', () => {
  it('renders four numbered steps', async () => {
    const html = await renderToHtml(Process, { locale: 'sk' });
    expect(count(html, /<li/g)).toBe(4);
    for (const n of ['1', '2', '3', '4']) expect(html).toMatch(new RegExp(`>\\s*${n}\\s*</span>`));
  });
  it('renders eight strengths', async () => {
    const html = await renderToHtml(Strengths, { locale: 'sk' });
    expect(count(html, /<li/g)).toBe(8);
    expect(html).toContain('Produkčná opatrnosť');
  });
});
