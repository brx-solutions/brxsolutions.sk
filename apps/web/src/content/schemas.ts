import { z } from 'astro/zod';

export const iconNames = ['api', 'data', 'legacy', 'web', 'bot', 'invoice', 'home'] as const;

export const experienceSchema = z.object({
  period: z.string(),
  role: z.string(),
  client: z.string(),
  tags: z.array(z.string()),
  order: z.number().int().positive(),
});

export const projectSchema = z.object({
  title: z.string(),
  context: z.string(),
  year: z.string(),
  metric: z.string(),
  metricLabel: z.string(),
  problem: z.string(),
  solution: z.string(),
  result: z.string(),
  tags: z.array(z.string()),
  order: z.number().int().positive(),
});

export const ownSchema = z.object({
  title: z.string(),
  status: z.string(),
  icon: z.enum(iconNames),
  tech: z.string(),
  tags: z.array(z.string()),
  order: z.number().int().positive(),
});

export const legalSchema = z.object({
  title: z.string(),
  updated: z.string(),
});

export const schemas = {
  experience: experienceSchema,
  projects: projectSchema,
  own: ownSchema,
  legal: legalSchema,
} as const;
