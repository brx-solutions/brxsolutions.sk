import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import { schemas } from '../src/content/schemas';

const ROOT = 'src/content';
const collections = ['experience', 'projects', 'own', 'legal'] as const;
const files = (dir: string) =>
  readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .sort();

function findPlaceholders(...dirs: string[]): { file: string; line: number; text: string }[] {
  const out: { file: string; line: number; text: string }[] = [];
  const walk = (p: string) => {
    for (const name of readdirSync(p)) {
      const full = join(p, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.(md|ts)$/.test(name)) {
        readFileSync(full, 'utf8')
          .split('\n')
          .forEach((text, i) => {
            if (/(^|[\s'"(])\[[A-Za-zÀ-ž0-9+][^\]\n]*\](?!\()/.test(text))
              out.push({ file: full, line: i + 1, text: text.trim() });
          });
      }
    }
  };
  dirs.forEach(walk);
  return out;
}

describe.each(collections)('content/%s', (collection) => {
  const skFiles = files(join(ROOT, collection, 'sk'));
  const enFiles = files(join(ROOT, collection, 'en'));

  it('has the same slugs in sk and en', () => {
    expect(skFiles.length).toBeGreaterThan(0);
    expect(enFiles).toEqual(skFiles);
  });

  it('frontmatter matches the schema', () => {
    for (const locale of ['sk', 'en']) {
      for (const f of files(join(ROOT, collection, locale))) {
        const { data } = matter(readFileSync(join(ROOT, collection, locale, f), 'utf8'));
        expect(() => schemas[collection].parse(data), `${collection}/${locale}/${f}`).not.toThrow();
      }
    }
  });

  it('order values are unique per locale', () => {
    if (collection === 'legal') return;
    for (const locale of ['sk', 'en']) {
      const orders = files(join(ROOT, collection, locale)).map(
        (f) => matter(readFileSync(join(ROOT, collection, locale, f), 'utf8')).data.order,
      );
      expect(new Set(orders).size).toBe(orders.length);
    }
  });
});

describe('placeholders', () => {
  it('reports [placeholders] left in content (warning only)', () => {
    const found = findPlaceholders(ROOT, 'src/i18n', 'src/config');
    if (found.length)
      process.stderr.write(
        'Unfilled placeholders:\n' +
          found.map((f) => `${f.file}:${f.line}: ${f.text}`).join('\n') +
          '\n',
      );
    expect(Array.isArray(found)).toBe(true);
  });
});
