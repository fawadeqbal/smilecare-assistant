import { Injectable, NotFoundException } from '@nestjs/common';
import type { ChatMessage, ConversationDetail, ConversationStatus, ConversationSummary, Paginated } from '@smilecare/shared';
import type { MessageRow } from '@/infrastructure/database/schema';
import { BookingsService } from '@/modules/bookings/bookings.service';
import { ConversationsRepository } from './conversations.repository';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly repo: ConversationsRepository,
    private readonly bookings: BookingsService,
  ) {}

  async list(businessId: string, page: number, pageSize: number, status?: ConversationStatus): Promise<Paginated<ConversationSummary>> {
    const { items, total } = await this.repo.list(businessId, { status, limit: pageSize, offset: (page - 1) * pageSize });
    return {
      items: items.map((c) => ({
        ...c,
        messageCount: Number(c.messageCount),
        handedOffAt: c.handedOffAt?.toISOString() ?? null,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      })),
      total,
      page,
      pageSize,
    };
  }

  async get(businessId: string, id: string): Promise<ConversationDetail> {
    const conversation = await this.repo.findById(businessId, id);
    if (!conversation) throw new NotFoundException('Conversation not found');
    const [rows, bookings] = await Promise.all([this.repo.allMessages(id), this.bookings.listForConversation(businessId, id)]);
    return {
      id: conversation.id,
      visitorId: conversation.visitorId,
      status: conversation.status,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
      messageCount: rows.length,
      lastMessage: rows.at(-1)?.content ?? null,
      lastVisitorMessage: rows.filter((m) => m.role === 'user').at(-1)?.content ?? null,
      handoffReason: conversation.handoffReason,
      handedOffAt: conversation.handedOffAt?.toISOString() ?? null,
      messages: rows.map(toChatMessage),
      bookings,
    };
  }

  async setStatus(businessId: string, id: string, status: ConversationStatus): Promise<void> {
    const conversation = await this.repo.findById(businessId, id);
    if (!conversation) throw new NotFoundException('Conversation not found');
    await this.repo.setStatus(id, status);
  }
}

export function toChatMessage(row: MessageRow): ChatMessage {
  return { id: row.id, role: row.role, content: row.content, sources: row.sources, createdAt: row.createdAt.toISOString() };
}
