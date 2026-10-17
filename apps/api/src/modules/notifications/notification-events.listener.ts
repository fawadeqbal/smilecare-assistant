import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import type { Queue } from 'bullmq';
import { NotificationJob, QUEUES } from '@/infrastructure/queue/queue.constants';
import { BookingCreatedEvent, ConversationHandedOffEvent, DomainEvents } from './domain-events';

/**
 * Bridges in-process domain events to the durable notifications queue.
 * Emails are sent by the worker with retries, so a slow or failing mail server
 * never slows down or breaks a chat response.
 */
@Injectable()
export class NotificationEventsListener {
  private readonly logger = new Logger(NotificationEventsListener.name);

  constructor(@InjectQueue(QUEUES.notifications) private readonly queue: Queue<NotificationJob>) {}

  @OnEvent(DomainEvents.BookingCreated, { async: true, suppressErrors: true })
  async onBookingCreated(event: BookingCreatedEvent) {
    await this.enqueue({ kind: 'booking.created', ...event }, `booking-${event.bookingId}`);
  }

  @OnEvent(DomainEvents.ConversationHandedOff, { async: true, suppressErrors: true })
  async onHandedOff(event: ConversationHandedOffEvent) {
    // Short delay so the transcript in the email includes the assistant's reply for this turn.
    await this.enqueue({ kind: 'conversation.handed_off', ...event }, `handoff-${event.conversationId}`, 5_000);
  }

  private async enqueue(job: NotificationJob, jobId: string, delay = 0) {
    try {
      await this.queue.add(job.kind, job, { jobId, delay });
    } catch (err) {
      this.logger.error({ err, job }, 'Failed to enqueue notification');
    }
  }
}
