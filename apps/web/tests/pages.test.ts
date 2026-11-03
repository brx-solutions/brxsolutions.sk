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
