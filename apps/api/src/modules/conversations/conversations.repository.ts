import { Injectable } from '@nestjs/common';
import type { ConversationStatus, MessageRole, MessageSource } from '@smilecare/shared';
import { and, asc, count, desc, eq, SQL, sql } from 'drizzle-orm';
import { Database, InjectDb } from '@/infrastructure/database/database.module';
import { ConversationRow, conversations, MessageRow, messages } from '@/infrastructure/database/schema';

@Injectable()
export class ConversationsRepository {
  constructor(@InjectDb() private readonly db: Database) {}

  async create(businessId: string, visitorId: string): Promise<ConversationRow> {
    const [row] = await this.db.insert(conversations).values({ businessId, visitorId }).returning();
    return row;
  }

  async findById(businessId: string, id: string): Promise<ConversationRow | undefined> {
    const [row] = await this.db
      .select()
      .from(conversations)
      .where(and(eq(conversations.businessId, businessId), eq(conversations.id, id)))
      .limit(1);
    return row;
  }

  async setStatus(id: string, status: ConversationStatus): Promise<void> {
    await this.db.update(conversations).set({ status }).where(eq(conversations.id, id));
  }

  async touch(id: string): Promise<void> {
    await this.db.update(conversations).set({ updatedAt: new Date() }).where(eq(conversations.id, id));
  }

  async addMessage(input: {
    conversationId: string;
    role: MessageRole;
    content: string;
    sources?: MessageSource[];
    metadata?: Record<string, unknown>;
  }): Promise<MessageRow> {
    const [row] = await this.db
      .insert(messages)
      .values({
        conversationId: input.conversationId,
        role: input.role,
        content: input.content,
        sources: input.sources ?? [],
        metadata: input.metadata ?? {},
      })
      .returning();
    return row;
  }

  /** Most recent messages in chronological order. */
  async recentMessages(conversationId: string, limit: number): Promise<MessageRow[]> {
    const rows = await this.db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.createdAt))
      .limit(limit);
    return rows.reverse();
  }

  async allMessages(conversationId: string): Promise<MessageRow[]> {
    return this.db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(asc(messages.createdAt));
  }

  async list(businessId: string, opts: { status?: ConversationStatus; limit: number; offset: number }) {
    const conditions: SQL[] = [eq(conversations.businessId, businessId)];
    if (opts.status) conditions.push(eq(conversations.status, opts.status));
    const where = and(...conditions);

    // Correlated subqueries. The outer column is written out fully qualified because Drizzle
    // renders column references inside a select list without their table name.
    const messageCount = sql<number>`(select count(*)::int from messages m where m.conversation_id = "conversations"."id")`;
    const lastMessage = sql<string | null>`(select m.content from messages m where m.conversation_id = "conversations"."id" order by m.created_at desc limit 1)`;

    const [items, [{ total }]] = await Promise.all([
      this.db
        .select({
          id: conversations.id,
          visitorId: conversations.visitorId,
          status: conversations.status,
          createdAt: conversations.createdAt,
          updatedAt: conversations.updatedAt,
          messageCount,
          lastMessage,
        })
        .from(conversations)
        .where(where)
        .orderBy(desc(conversations.updatedAt))
        .limit(opts.limit)
        .offset(opts.offset),
      this.db.select({ total: count() }).from(conversations).where(where),
    ]);
    return { items, total };
  }
}
