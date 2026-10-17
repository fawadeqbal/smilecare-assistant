import { Global, Injectable, Logger, Module } from '@nestjs/common';
import nodemailer, { Transporter } from 'nodemailer';
import { AppConfig } from '@/config/app-config.service';
import { MAILER_PORT, MailerPort, MailMessage } from './mailer.port';

/** Sends mail over SMTP (works with any provider: SES, Postmark, Mailgun, Gmail...). */
@Injectable()
export class SmtpMailerAdapter implements MailerPort {
  private readonly transporter: Transporter;

  constructor(private readonly config: AppConfig) {
    this.transporter = nodemailer.createTransport({
      host: config.get('SMTP_HOST'),
      port: config.get('SMTP_PORT'),
      secure: config.get('SMTP_SECURE'),
      auth: config.get('SMTP_USER') ? { user: config.get('SMTP_USER'), pass: config.get('SMTP_PASS') } : undefined,
    });
  }

  async send(message: MailMessage): Promise<void> {
    await this.transporter.sendMail({ from: this.config.get('MAIL_FROM'), ...message });
  }
}

/** Logs mail instead of sending it. Default in development. */
@Injectable()
export class ConsoleMailerAdapter implements MailerPort {
  private readonly logger = new Logger('Mail');

  async send(message: MailMessage): Promise<void> {
    this.logger.log(`To: ${[message.to].flat().join(', ')} | Subject: ${message.subject}\n${message.text}`);
  }
}

@Global()
@Module({
  providers: [
    {
      provide: MAILER_PORT,
      inject: [AppConfig],
      useFactory: (config: AppConfig): MailerPort =>
        config.get('MAIL_PROVIDER') === 'smtp' ? new SmtpMailerAdapter(config) : new ConsoleMailerAdapter(),
    },
  ],
  exports: [MAILER_PORT],
})
export class MailModule {}
