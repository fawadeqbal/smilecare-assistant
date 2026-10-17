import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { ChatStreamEvent, SessionHistoryResponse, StartSessionResponse } from '@smilecare/shared';
import type { BusinessRow, ConversationRow } from '@/infrastructure/database/schema';
import { BusinessesService } from '@/modules/businesses/businesses.service';
import { ConversationsRepository } from '@/modules/conversations/conversations.repository';
import { toChatMessage } from '@/modules/conversations/conversations.service';
import { ChatAgentService } from './agent/chat-agent.service';

/** Public chat use cases: resolves the tenant and visitor, then delegates to the agent. */
@Injectable()
export class ChatService {
  constructor(
    private readonly businesses: BusinessesService,
    private readonly conversations: ConversationsRepository,
    private readonly agent: ChatAgentService,
  ) {}

  async startSession(widgetKey: string, visitorId: string): Promise<StartSessionResponse> {
    const business = await this.businesses.getByWidgetKey(widgetKey);
    const conversation = await this.conversations.create(business.id, visitorId);
    return { sessionId: conversation.id, status: conversation.status };
  }

  async history(sessionId: string, widgetKey: string, visitorId: string): Promise<SessionHistoryResponse> {
    const { conversation } = await this.resolve(sessionId, widgetKey, visitorId);
    const messages = await this.conversations.allMessages(conversation.id);
    return { sessionId: conversation.id, status: conversation.status, messages: messages.map(toChatMessage) };
  }

  /** Validates the session up front so the caller can return a normal HTTP error before streaming starts. */
  async resolve(sessionId: string, widgetKey: string, visitorId: string): Promise<{ business: BusinessRow; conversation: ConversationRow }> {
    const business = await this.businesses.getByWidgetKey(widgetKey);
    const conversation = await this.conversations.findById(business.id, sessionId);
    if (!conversation) throw new NotFoundException('Session not found');
    if (conversation.visitorId !== visitorId) throw new ForbiddenException('Session belongs to another visitor');
    if (conversation.status === 'closed') throw new ForbiddenException('This conversation has been closed');
    return { business, conversation };
  }

  sendMessage(
    session: { business: BusinessRow; conversation: ConversationRow },
    text: string,
    emit: (event: ChatStreamEvent) => void,
    signal?: AbortSignal,
  ): Promise<void> {
    return this.agent.handleMessage({ ...session, text, emit, signal });
  }
}
