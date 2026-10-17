import { Injectable } from '@nestjs/common';
import type { DailyActivity, OverviewRange, OverviewStats } from '@smilecare/shared';
import { sql } from 'drizzle-orm';
import { Database, InjectDb } from '@/infrastructure/database/database.module';
import { BusinessesService } from '@/modules/businesses/businesses.service';

/**
 * Numbers for the dashboard overview. Each figure is one aggregate query scoped by business,
 * so the cost stays flat as data grows (all filtered columns are indexed).
 * Days are bucketed in the business's own time zone, so "today" matches the clinic's calendar.
 */
@Injectable()
export class AnalyticsService {
  constructor(
    @InjectDb() private readonly db: Database,
    private readonly businesses: BusinessesService,
  ) {}

  async overview(businessId: string, range: OverviewRange = 14): Promise<OverviewStats> {
    const { timezone } = await this.businesses.getById(businessId);
    const history = await this.dailyActivity(businessId, timezone, Math.max(range, 14));
    const daily = history.slice(-range);
    const last14 = history.slice(-14);
    const sum = (rows: DailyActivity[], key: 'conversations' | 'bookings') => rows.reduce((s, r) => s + r[key], 0);

    const [week] = (
      await this.db.execute<{ resolved: number; visitor_messages: number }>(sql`
        select
          (select count(*)::int from conversations
            where business_id = ${businessId} and created_at > now() - interval '7 days' and handed_off_at is null) as resolved,
          (select count(*)::int from messages m join conversations c on c.id = m.conversation_id
            where c.business_id = ${businessId} and m.role = 'user' and m.created_at > now() - interval '7 days') as visitor_messages
      `)
    ).rows;

    const [state] = (
      await this.db.execute<{
        waiting: number;
        longest_since: Date | null;
        pending: number;
        doc_total: number;
        doc_ready: number;
        chunks: number;
        last_indexed: Date | null;
      }>(sql`
        select
          (select count(*)::int from conversations where business_id = ${businessId} and status = 'handed_off') as waiting,
          (select min(coalesce(handed_off_at, updated_at)) from conversations where business_id = ${businessId} and status = 'handed_off') as longest_since,
          (select count(*)::int from bookings where business_id = ${businessId} and status = 'pending') as pending,
          (select count(*)::int from documents where business_id = ${businessId}) as doc_total,
          (select count(*)::int from documents where business_id = ${businessId} and status = 'ready') as doc_ready,
          (select coalesce(sum(chunk_count), 0)::int from documents where business_id = ${businessId}) as chunks,
          (select max(updated_at) from documents where business_id = ${businessId} and status = 'ready') as last_indexed
      `)
    ).rows;

    // The top source of each answer stands in for "what the visitor asked about".
    const topTopics = (
      await this.db.execute<{ label: string; count: number }>(sql`
        select m.sources -> 0 ->> 'documentTitle' as label, count(*)::int as count
        from messages m
        join conversations c on c.id = m.conversation_id
        where c.business_id = ${businessId}
          and m.role = 'assistant'
          and m.created_at > now() - interval '7 days'
          and jsonb_array_length(m.sources) > 0
        group by 1
        order by 2 desc, 1
        limit 5
      `)
    ).rows;

    return {
      range,
      daily,
      week: {
        conversations: sum(history.slice(-7), 'conversations'),
        conversationsPrev: sum(history.slice(-14, -7), 'conversations'),
        bookings: sum(history.slice(-7), 'bookings'),
        bookingsPrev: sum(history.slice(-14, -7), 'bookings'),
        resolvedBySunny: week.resolved,
        visitorMessages: week.visitor_messages,
      },
      sparks: { conversations: last14.map((d) => d.conversations), bookings: last14.map((d) => d.bookings) },
      waiting: { count: state.waiting, longestSince: state.longest_since ? new Date(state.longest_since).toISOString() : null },
      bookings: { pending: state.pending },
      documents: {
        total: state.doc_total,
        ready: state.doc_ready,
        chunks: state.chunks,
        lastIndexedAt: state.last_indexed ? new Date(state.last_indexed).toISOString() : null,
      },
      topTopics,
    };
  }

  private async dailyActivity(businessId: string, timezone: string, days: number): Promise<DailyActivity[]> {
    const rows = (
      await this.db.execute<{ date: string; conversations: number; bookings: number }>(sql`
        with days as (
          select generate_series(
            (now() at time zone ${timezone})::date - (${days - 1})::int,
            (now() at time zone ${timezone})::date,
            interval '1 day'
          )::date as d
        ),
        conv as (
          select (created_at at time zone ${timezone})::date as d, count(*)::int as n
          from conversations
          where business_id = ${businessId} and created_at > now() - make_interval(days => ${days + 1})
          group by 1
        ),
        book as (
          select (created_at at time zone ${timezone})::date as d, count(*)::int as n
          from bookings
          where business_id = ${businessId} and created_at > now() - make_interval(days => ${days + 1})
          group by 1
        )
        select to_char(days.d, 'YYYY-MM-DD') as date,
               coalesce(conv.n, 0) as conversations,
               coalesce(book.n, 0) as bookings
        from days
        left join conv on conv.d = days.d
        left join book on book.d = days.d
        order by days.d
      `)
    ).rows;
    return rows.map((r) => ({ date: r.date, conversations: Number(r.conversations), bookings: Number(r.bookings) }));
  }
}
