export const MAILER_PORT = Symbol('MAILER_PORT');

export interface MailMessage {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}

export interface MailerPort {
  send(message: MailMessage): Promise<void>;
}
