import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { experienceSchema, projectSchema, ownSchema, legalSchema } from './content/schemas';

const md = (name: string) => glob({ base: `./src/content/${name}`, pattern: '**/*.md' });

export const collections = {
  experience: defineCollection({ loader: md('experience'), schema: experienceSchema }),
  projects: defineCollection({ loader: md('projects'), schema: projectSchema }),
  own: defineCollection({ loader: md('own'), schema: ownSchema }),
  legal: defineCollection({ loader: md('legal'), schema: legalSchema }),
};
