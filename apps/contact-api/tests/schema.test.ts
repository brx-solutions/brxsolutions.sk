import { describe, it, expect } from 'vitest';
import { contactSchema } from '../src/schema.js';

const valid = {
  name: 'Peter',
  email: 'peter@example.com',
  type: 'ai',
  message: 'Hello, I have a project for you.',
  lang: 'sk',
  website: '',
  'cf-turnstile-response': 'XXXX.DUMMY.TOKEN.XXXX',
};

describe('contactSchema', () => {
  it('accepts a valid submission and trims text', () => {
    const r = contactSchema.parse({ ...valid, name: '  Peter  ' });
    expect(r.name).toBe('Peter');
    expect(r.website).toBe('');
  });
  it('rejects a name made of whitespace', () => {
    expect(contactSchema.safeParse({ ...valid, name: '   ' }).success).toBe(false);
  });
  it('rejects a message shorter than 10 characters', () => {
    expect(contactSchema.safeParse({ ...valid, message: '123456789' }).success).toBe(false);
  });
  it('accepts 5000 four-byte characters', () => {
    expect(contactSchema.safeParse({ ...valid, message: '😀'.repeat(5000) }).success).toBe(true);
  });
  it('rejects 5001 characters', () => {
    expect(contactSchema.safeParse({ ...valid, message: 'a'.repeat(5001) }).success).toBe(false);
  });
  it('rejects a filled honeypot', () => {
    expect(contactSchema.safeParse({ ...valid, website: 'x' }).success).toBe(false);
  });
  it('accepts a missing honeypot field', () => {
    const { website: _w, ...rest } = valid;
    expect(contactSchema.safeParse(rest).success).toBe(true);
  });
  it('rejects an unknown project type and an invalid email', () => {
    expect(contactSchema.safeParse({ ...valid, type: 'other' }).success).toBe(false);
    expect(contactSchema.safeParse({ ...valid, email: 'a@b' }).success).toBe(false);
  });
  it('rejects a missing turnstile token', () => {
    expect(contactSchema.safeParse({ ...valid, 'cf-turnstile-response': '' }).success).toBe(false);
  });
});
