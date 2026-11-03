import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import type { Locale } from '../i18n/locales';

type Ordered = 'experience' | 'projects' | 'own';

export async function localized<C extends Ordered>(
  collection: C,
  locale: Locale,
): Promise<CollectionEntry<C>[]> {
  const entries = await getCollection(collection, ({ id }) => id.startsWith(`${locale}/`));
  return entries.sort((a, b) => a.data.order - b.data.order);
}

export async function legal(locale: Locale): Promise<CollectionEntry<'legal'>> {
  const entry = await getEntry('legal', `${locale}/privacy`);
  if (!entry) throw new Error(`Missing legal/${locale}/privacy.md`);
  return entry;
}
