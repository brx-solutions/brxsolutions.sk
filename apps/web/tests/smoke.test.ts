import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';

describe('build output', () => {
  it('writes index.html with lang=sk', () => {
    expect(existsSync('dist/index.html')).toBe(true);
    expect(readFileSync('dist/index.html', 'utf8')).toContain('<html lang="sk"');
  });
});
