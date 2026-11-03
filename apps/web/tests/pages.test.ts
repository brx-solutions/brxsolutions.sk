import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';

const read = (p: string) => readFileSync(p, 'utf8');
const sections = ['sluzby', 'stack', 'skusenosti', 'projekty', 'vlastne', 'kontakt'];

describe('built pages', () => {
  it.each([
    ['dist/index.html', 'sk'],
    ['dist/en/index.html', 'en'],
  ])('%s is a full home page in %s', (file, lang) => {
    expect(existsSync(file)).toBe(true);
    const html = read(file);
    expect(html).toContain(`<html lang="${lang}"`);
    for (const id of sections) expect(html).toContain(`id="${id}"`);
    expect(html).not.toContain('fonts.googleapis');
  });
});

describe('secondary pages', () => {
  it.each([
    ['dist/ochrana-osobnych-udajov/index.html', 'sk', 'Ochrana osobných údajov'],
    ['dist/en/privacy/index.html', 'en', 'Privacy policy'],
    ['dist/sprava-odoslana/index.html', 'sk', 'Správa odoslaná'],
    ['dist/en/message-sent/index.html', 'en', 'Message sent'],
    ['dist/sprava-neodoslana/index.html', 'sk', 'Správu sa nepodarilo odoslať'],
    ['dist/en/message-failed/index.html', 'en', 'Message not sent'],
  ])('%s exists in %s with its title', (file, lang, title) => {
    expect(existsSync(file)).toBe(true);
    const html = read(file);
    expect(html).toContain(`<html lang="${lang}"`);
    expect(html).toContain(title);
  });

  it('privacy pages carry the company name and the updated date', () => {
    for (const f of ['dist/ochrana-osobnych-udajov/index.html', 'dist/en/privacy/index.html']) {
      const html = read(f);
      expect(html).toContain('BRX Solutions s.r.o.');
      expect(html).toContain('2026-11-03');
    }
  });
});

describe('content security policy compatibility', () => {
  // Production Caddy sends script-src 'self' and style-src 'self' with no 'unsafe-inline',
  // so every script must be an external file and no element may carry a style attribute.
  it.each(['dist/index.html', 'dist/en/index.html'])('%s has no inline scripts or styles', (file) => {
    const html = read(file);
    const inlineScripts = [...html.matchAll(/<script\b(?![^>]*\bsrc=)(?![^>]*type="application\/ld\+json")[^>]*>/g)];
    expect(inlineScripts.map((m) => m[0])).toEqual([]);
    expect(html).not.toMatch(/\sstyle="/);
  });
});
