import { z } from 'zod';

export const projectTypes = ['ai', 'backend', 'web', 'audit', 'cv'] as const;
export const languages = ['sk', 'en'] as const;

export const contactSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.email().max(254),
  type: z.enum(projectTypes),
  message: z.string().trim().min(10).max(5000),
  lang: z.enum(languages),
  // Honeypot: real users never see or fill it.
  website: z.string().max(0).optional().default(''),
  'cf-turnstile-response': z.string().min(1),
});

export type ContactInput = z.infer<typeof contactSchema>;
