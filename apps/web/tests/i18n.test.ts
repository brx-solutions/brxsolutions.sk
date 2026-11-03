import { describe, it, expect } from 'vitest';
import { sk } from '../src/i18n/sk';
import { en } from '../src/i18n/en';
import { t, localePath, localeHome } from '../src/i18n';

function keyPaths(value: unknown, prefix = ''): string[] {
  if (Array.isArray(value)) return [`${prefix}[${value.length}]`];
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([k, v]) => keyPaths(v, prefix ? `${prefix}.${k}` : k));
  }
  return [prefix];
}

describe('i18n', () => {
  it('sk and en expose the same key paths', () => {
    expect(keyPaths(en)).toEqual(keyPaths(sk));
  });

  it('t() returns the matching dictionary', () => {
    expect(t('sk').nav.services).toBe('Služby');
    expect(t('en').nav.services).toBe('Services');
  });

  it('localePath builds prefixed urls with trailing slash', () => {
    expect(localePath('sk', 'ochrana-osobnych-udajov')).toBe('/ochrana-osobnych-udajov/');
    expect(localePath('en', 'privacy')).toBe('/en/privacy/');
    expect(localeHome('en')).toBe('/en/');
    expect(localeHome('sk')).toBe('/');
  });
});
