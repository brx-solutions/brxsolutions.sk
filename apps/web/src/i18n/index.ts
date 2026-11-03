import type { Dictionary } from './dictionary';
import { sk } from './sk';
import { en } from './en';
import { defaultLocale, type Locale } from './locales';

export { locales, defaultLocale, type Locale } from './locales';
export type { Dictionary, IconName, ProjectType } from './dictionary';

const dictionaries: Record<Locale, Dictionary> = { sk, en };

export function t(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export function localeHome(locale: Locale): string {
  return locale === defaultLocale ? '/' : `/${locale}/`;
}

export function localePath(locale: Locale, path: string): string {
  const clean = path.replace(/^\/+|\/+$/g, '');
  return clean ? `${localeHome(locale)}${clean}/` : localeHome(locale);
}

export const anchors = {
  services: 'sluzby',
  stack: 'stack',
  experience: 'skusenosti',
  projects: 'projekty',
  own: 'vlastne',
  contact: 'kontakt',
} as const;

export const legalPath: Record<Locale, string> = { sk: 'ochrana-osobnych-udajov', en: 'privacy' };
export const sentPath: Record<Locale, string> = { sk: 'sprava-odoslana', en: 'message-sent' };
export const failedPath: Record<Locale, string> = { sk: 'sprava-neodoslana', en: 'message-failed' };
