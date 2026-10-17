import { Injectable } from '@nestjs/common';
import type { BookingStatus } from '@smilecare/shared';
import { and, count, desc, eq, SQL } from 'drizzle-orm';
import { Database, InjectDb } from '@/infrastructure/database/database.module';
import { BookingRow, bookings } from '@/infrastructure/database/schema';

export type NewBooking = typeof bookings.$inferInsert;

@Injectable()
export class BookingsRepository {
  constructor(@InjectDb() private readonly db: Database) {}

  async create(input: NewBooking): Promise<BookingRow> {
    const [row] = await this.db.insert(bookings).values(input).returning();
    return row;
  }

  async findById(businessId: string, id: string): Promise<BookingRow | undefined> {
    const [row] = await this.db
      .select()
      .from(bookings)
      .where(and(eq(bookings.businessId, businessId), eq(bookings.id, id)))
      .limit(1);
    return row;
  }

  async list(businessId: string, opts: { status?: BookingStatus; limit: number; offset: number }) {
    const conditions: SQL[] = [eq(bookings.businessId, businessId)];
    if (opts.status) conditions.push(eq(bookings.status, opts.status));
    const where = and(...conditions);
    const [items, [{ total }]] = await Promise.all([
      this.db.select().from(bookings).where(where).orderBy(desc(bookings.createdAt)).limit(opts.limit).offset(opts.offset),
      this.db.select({ total: count() }).from(bookings).where(where),
    ]);
    return { items, total };
  }

  async listByConversation(businessId: string, conversationId: string): Promise<BookingRow[]> {
    return this.db
      .select()
      .from(bookings)
      .where(and(eq(bookings.businessId, businessId), eq(bookings.conversationId, conversationId)))
      .orderBy(desc(bookings.createdAt));
  }

  async updateStatus(businessId: string, id: string, status: BookingStatus): Promise<BookingRow | undefined> {
    const [row] = await this.db
      .update(bookings)
      .set({ status })
      .where(and(eq(bookings.businessId, businessId), eq(bookings.id, id)))
      .returning();
    return row;
  }
}
