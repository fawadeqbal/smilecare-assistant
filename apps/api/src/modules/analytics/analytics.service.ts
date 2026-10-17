import { Injectable } from '@nestjs/common';
import type { OverviewStats } from '@smilecare/shared';
import { sql } from 'drizzle-orm';
import { Database, InjectDb } from '@/infrastructure/database/database.module';

@Injectable()
export class AnalyticsService {
  constructor(@InjectDb() private readonly db: Database) {}

  async overview(businessId: string, days = 14): Promise<OverviewStats> {
    const [counts] = (
      await this.db.execute<{
        conv_total: number;
        conv_7d: number;
        conv_handed_off: number;
        book_total: number;
        book_pending: number;
        book_confirmed: number;
        doc_total: number;
        doc_ready: number;
      }>(sql`
        select
          (select count(*)::int from conversations where business_id = ${businessId}) as conv_total,
          (select count(*)::int from conversations where business_id = ${businessId} and created_at > now() - interval '7 days') as conv_7d,
          (select count(*)::int from conversations where business_id = ${businessId} and status = 'handed_off') as conv_handed_off,
          (select count(*)::int from bookings where business_id = ${businessId}) as book_total,
          (select count(*)::int from bookings where business_id = ${businessId} and status = 'pending') as book_pending,
          (select count(*)::int from bookings where business_id = ${businessId} and status = 'confirmed') as book_confirmed,
          (select count(*)::int from documents where business_id = ${businessId}) as doc_total,
          (select count(*)::int from documents where business_id = ${businessId} and status = 'ready') as doc_ready
      `)
    ).rows;

    const daily = (
      await this.db.execute<{ date: string; conversations: number; bookings: number }>(sql`
        with days as (
          select generate_series(current_date - (${days - 1})::int, current_date, interval '1 day')::date as d
        )
        select
          to_char(days.d, 'YYYY-MM-DD') as date,
          (select count(*)::int from conversations c where c.business_id = ${businessId} and c.created_at::date = days.d) as conversations,
          (select count(*)::int from bookings b where b.business_id = ${businessId} and b.created_at::date = days.d) as bookings
        from days
        order by days.d
      `)
    ).rows;

    return {
      conversations: { total: counts.conv_total, last7Days: counts.conv_7d, handedOff: counts.conv_handed_off },
      bookings: { total: counts.book_total, pending: counts.book_pending, confirmed: counts.book_confirmed },
      documents: { total: counts.doc_total, ready: counts.doc_ready },
      daily,
    };
  }
}
