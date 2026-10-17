import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { Booking, BookingStatus, Paginated } from '@smilecare/shared';
import type { BookingRow } from '@/infrastructure/database/schema';
import { DomainEvents, BookingCreatedEvent } from '@/modules/notifications/domain-events';
import { BookingsRepository } from './bookings.repository';

export interface CreateBookingInput {
  businessId: string;
  conversationId: string | null;
  patientName: string;
  phone: string;
  email?: string | null;
  service?: string | null;
  preferredTime?: string | null;
  notes?: string | null;
}

@Injectable()
export class BookingsService {
  constructor(
    private readonly repo: BookingsRepository,
    private readonly events: EventEmitter2,
  ) {}

  /** Creates a booking and publishes `booking.created`; side effects (email etc.) subscribe to that event. */
  async create(input: CreateBookingInput): Promise<Booking> {
    const row = await this.repo.create({
      businessId: input.businessId,
      conversationId: input.conversationId,
      patientName: input.patientName.trim(),
      phone: input.phone.trim(),
      email: input.email?.trim() || null,
      service: input.service?.trim() || null,
      preferredTime: input.preferredTime?.trim() || null,
      notes: input.notes?.trim() || null,
    });
    this.events.emit(DomainEvents.BookingCreated, { businessId: row.businessId, bookingId: row.id } satisfies BookingCreatedEvent);
    return toBookingDto(row);
  }

  async list(businessId: string, page: number, pageSize: number, status?: BookingStatus): Promise<Paginated<Booking>> {
    const { items, total } = await this.repo.list(businessId, { status, limit: pageSize, offset: (page - 1) * pageSize });
    return { items: items.map(toBookingDto), total, page, pageSize };
  }

  async get(businessId: string, id: string): Promise<Booking> {
    const row = await this.repo.findById(businessId, id);
    if (!row) throw new NotFoundException('Booking not found');
    return toBookingDto(row);
  }

  async listForConversation(businessId: string, conversationId: string): Promise<Booking[]> {
    return (await this.repo.listByConversation(businessId, conversationId)).map(toBookingDto);
  }

  async updateStatus(businessId: string, id: string, status: BookingStatus): Promise<Booking> {
    const row = await this.repo.updateStatus(businessId, id, status);
    if (!row) throw new NotFoundException('Booking not found');
    return toBookingDto(row);
  }

  /** Streams all bookings as CSV, page by page, so large exports don't load into memory at once. */
  async *exportCsv(businessId: string): AsyncGenerator<string> {
    yield 'id,created_at,status,patient_name,phone,email,service,preferred_time,notes\n';
    const pageSize = 500;
    for (let offset = 0; ; offset += pageSize) {
      const { items } = await this.repo.list(businessId, { limit: pageSize, offset });
      for (const b of items) {
        yield [b.id, b.createdAt.toISOString(), b.status, b.patientName, b.phone, b.email, b.service, b.preferredTime, b.notes]
          .map(csvCell)
          .join(',') + '\n';
      }
      if (items.length < pageSize) return;
    }
  }
}

export function toBookingDto(row: BookingRow): Booking {
  return {
    id: row.id,
    conversationId: row.conversationId,
    patientName: row.patientName,
    phone: row.phone,
    email: row.email,
    service: row.service,
    preferredTime: row.preferredTime,
    notes: row.notes,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function csvCell(value: string | null): string {
  if (value === null) return '';
  // Neutralise spreadsheet formula injection, then quote.
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}
