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
