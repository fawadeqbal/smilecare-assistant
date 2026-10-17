import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { asc, eq } from 'drizzle-orm';
import { Database, InjectDb } from '@/infrastructure/database/database.module';
import { bookings, businesses, BusinessRow, messages } from '@/infrastructure/database/schema';
import { MAILER_PORT, MailerPort } from '@/infrastructure/mail/mailer.port';
import { NotificationJob, QUEUES } from '@/infrastructure/queue/queue.constants';

/** Worker-side consumer that turns notification jobs into emails. */
@Processor(QUEUES.notifications, { concurrency: 5 })
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(
    @InjectDb() private readonly db: Database,
    @Inject(MAILER_PORT) private readonly mailer: MailerPort,
  ) {
    super();
  }

  async process(job: Job<NotificationJob>) {
    const [business] = await this.db.select().from(businesses).where(eq(businesses.id, job.data.businessId)).limit(1);
    if (!business) return;

    switch (job.data.kind) {
      case 'booking.created':
        return this.sendBookingCreated(business, job.data.bookingId);
      case 'conversation.handed_off':
        return this.sendHandoff(business, job.data.conversationId, job.data.reason);
    }
  }

  private async sendBookingCreated(business: BusinessRow, bookingId: string) {
    const to = business.notificationEmail ?? business.handoffEmail;
    if (!to) return this.logger.warn(`No notification email for ${business.name}; skipping booking email`);

    const [b] = await this.db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
    if (!b) return;

    await this.mailer.send({
      to,
      subject: `New appointment request: ${b.patientName}${b.service ? ` (${b.service})` : ''}`,
      text: [
        `A new appointment request was captured by ${business.botName}.`,
        '',
        `Name:           ${b.patientName}`,
        `Phone:          ${b.phone}`,
        `Email:          ${b.email ?? '-'}`,
        `Service:        ${b.service ?? '-'}`,
        `Preferred time: ${b.preferredTime ?? '-'}`,
        `Notes:          ${b.notes ?? '-'}`,
        '',
        'Please contact the patient to confirm, then mark the booking as confirmed in the dashboard.',
      ].join('\n'),
    });
  }

  private async sendHandoff(business: BusinessRow, conversationId: string, reason: string) {
    const to = business.handoffEmail ?? business.notificationEmail;
    if (!to) return this.logger.warn(`No handoff email for ${business.name}; skipping handoff email`);

    const transcript = await this.db
      .select({ role: messages.role, content: messages.content, createdAt: messages.createdAt })
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt));

    await this.mailer.send({
      to,
      subject: `A visitor needs a human: ${reason}`,
      text: [
        `${business.botName} handed a conversation over to your team.`,
        `Reason: ${reason}`,
        `Conversation: ${conversationId}`,
        '',
        '--- Transcript ---',
        ...transcript.map((m) => `[${m.createdAt.toISOString()}] ${m.role === 'user' ? 'Visitor' : 'Assistant'}: ${m.content}`),
      ].join('\n'),
    });
  }
}
