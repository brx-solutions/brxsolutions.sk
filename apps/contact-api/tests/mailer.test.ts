import { describe, it, expect, vi } from 'vitest';

const send = vi.fn();
vi.mock('resend', () => ({ Resend: class { emails = { send } } }));

import { createResendMailer, renderMailText, subjectFor, MailFailed, type ContactMail } from '../src/mailer.js';

const mail: ContactMail = {
  input: {
    name: 'Peter <b>bold</b>',
    email: 'peter@example.com',
    type: 'backend',
    message: 'Line one\nLine two',
    lang: 'en',
    website: '',
    'cf-turnstile-response': 'tok',
  },
  ip: '1.2.3.4',
  receivedAt: new Date('2026-11-03T10:00:00Z'),
};

describe('mailer', () => {
  it('renders every field as plain text without escaping', () => {
    const text = renderMailText(mail);
    expect(text).toContain('Peter <b>bold</b>');
    expect(text).toContain('peter@example.com');
    expect(text).toContain('backend');
    expect(text).toContain('Line one\nLine two');
    expect(text).toContain('1.2.3.4');
    expect(text).toContain('2026-11-03');
    expect(text).not.toContain('&lt;');
  });
  it('builds the subject from type and name', () => {
    expect(subjectFor(mail)).toBe('[brxsolutions.sk] backend – Peter <b>bold</b>');
  });
  it('sends through Resend with reply-to set to the sender', async () => {
    send.mockResolvedValueOnce({ data: { id: 'x' }, error: null });
    await createResendMailer({ apiKey: 'k', from: 'web@brxsolutions.sk', to: 'me@example.com' })(mail);
    expect(send).toHaveBeenCalledWith({
      from: 'web@brxsolutions.sk',
      to: ['me@example.com'],
      replyTo: 'peter@example.com',
      subject: subjectFor(mail),
      text: renderMailText(mail),
    });
  });
  it('throws MailFailed when the SDK reports an error', async () => {
    send.mockResolvedValueOnce({ data: null, error: { name: 'validation_error', message: 'bad' } });
    const mailer = createResendMailer({ apiKey: 'k', from: 'a@b.c', to: 'd@e.f' });
    await expect(mailer(mail)).rejects.toBeInstanceOf(MailFailed);
  });
});
