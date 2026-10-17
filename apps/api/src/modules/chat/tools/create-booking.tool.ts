import { Injectable } from '@nestjs/common';
import { and, count, eq } from 'drizzle-orm';
import { z } from 'zod';
import { Database, InjectDb } from '@/infrastructure/database/database.module';
import { bookings } from '@/infrastructure/database/schema';
import { BookingsService } from '@/modules/bookings/bookings.service';
import { ChatTool, ChatToolContext, ChatToolResult } from './chat-tool';

const MAX_BOOKINGS_PER_CONVERSATION = 3;

const schema = z.object({
  patient_name: z.string().trim().min(2).max(120).describe("The patient's full name"),
  phone: z
    .string()
    .trim()
    .min(7)
    .max(25)
    .regex(/^[+()\-\s\d]+$/, 'must contain only digits, spaces, +, - or parentheses')
    .describe('Contact phone number, including country code if the visitor gave one'),
  preferred_time: z.string().trim().min(2).max(120).describe('Preferred day and time, as the visitor described it'),
  service: z.string().trim().max(120).optional().describe('The service requested, e.g. "cleaning" or "whitening"'),
  email: z.string().trim().email().optional().describe('Email address, only if the visitor provided one'),
  notes: z.string().trim().max(500).optional().describe('Anything else relevant, such as symptoms or accessibility needs'),
});

@Injectable()
export class CreateBookingTool extends ChatTool<typeof schema> {
  readonly name = 'create_booking';
  readonly description =
    'Save an appointment request for the clinic team to confirm. Only call this after the visitor has given ' +
    'their name, phone number and preferred time, and has confirmed the details are correct. ' +
    'This does not guarantee the slot; staff will call to confirm.';
  readonly schema = schema;

  constructor(
    private readonly bookingsService: BookingsService,
    @InjectDb() private readonly db: Database,
  ) {
    super();
  }

  async execute(input: z.infer<typeof schema>, ctx: ChatToolContext): Promise<ChatToolResult> {
    const [{ total }] = await this.db
      .select({ total: count() })
      .from(bookings)
      .where(and(eq(bookings.businessId, ctx.business.id), eq(bookings.conversationId, ctx.conversationId)));
    if (total >= MAX_BOOKINGS_PER_CONVERSATION) {
      return {
        content: 'Booking limit reached for this chat. Tell the visitor the team will contact them about their existing requests.',
        isError: true,
      };
    }

    const booking = await this.bookingsService.create({
      businessId: ctx.business.id,
      conversationId: ctx.conversationId,
      patientName: input.patient_name,
      phone: input.phone,
      preferredTime: input.preferred_time,
      service: input.service,
      email: input.email,
      notes: input.notes,
    });

    ctx.emit({
      type: 'booking',
      booking: {
        id: booking.id,
        patientName: booking.patientName,
        service: booking.service,
        preferredTime: booking.preferredTime,
        status: booking.status,
      },
    });

    return {
      content: JSON.stringify({
        ok: true,
        reference: booking.id.slice(0, 8).toUpperCase(),
        status: 'pending',
        next_step: 'The clinic team will call the visitor to confirm the exact time.',
      }),
    };
  }
}
