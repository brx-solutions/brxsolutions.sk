import { Resend } from 'resend';
import type { ContactInput } from './schema.js';

export interface ContactMail {
  input: ContactInput;
  ip: string | undefined;
  receivedAt: Date;
}

export type Mailer = (mail: ContactMail) => Promise<void>;

export class MailFailed extends Error {
  constructor(cause: unknown) {
    super('Mail delivery failed');
    this.name = 'MailFailed';
    this.cause = cause;
  }
}

export function subjectFor(mail: ContactMail): string {
  return `[brxsolutions.sk] ${mail.input.type} – ${mail.input.name}`;
}

/** Plain text only. User input is never interpreted as HTML. */
export function renderMailText(mail: ContactMail): string {
  const { input, ip, receivedAt } = mail;
  return [
    `Name:     ${input.name}`,
    `Email:    ${input.email}`,
    `Type:     ${input.type}`,
    `Language: ${input.lang}`,
    `Received: ${receivedAt.toISOString()}`,
    `IP:       ${ip ?? 'unknown'}`,
    '',
    'Message:',
    input.message,
    '',
  ].join('\n');
}

export function createResendMailer(opts: { apiKey: string; from: string; to: string }): Mailer {
  const resend = new Resend(opts.apiKey);
  return async (mail) => {
    const { error } = await resend.emails.send({
      from: opts.from,
      to: [opts.to],
      replyTo: mail.input.email,
      subject: subjectFor(mail),
      text: renderMailText(mail),
    });
    if (error) throw new MailFailed(error);
  };
}

export function createConsoleMailer(
  log: (line: string) => void = (l) => process.stdout.write(l + '\n'),
): Mailer {
  return async (mail) => {
    log(
      `--- contact mail (console transport) ---\nSubject: ${subjectFor(mail)}\n${renderMailText(mail)}---`,
    );
  };
}
