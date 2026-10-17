import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { z } from 'zod';
import { ConversationsRepository } from '@/modules/conversations/conversations.repository';
import { ConversationHandedOffEvent, DomainEvents } from '@/modules/notifications/domain-events';
import { ChatTool, ChatToolContext, ChatToolResult } from './chat-tool';

const schema = z.object({
  reason: z
    .string()
    .trim()
    .min(3)
    .max(200)
    .describe('Short reason for the handoff, e.g. "asked for a human" or "question about a billing dispute"'),
});

@Injectable()
export class RequestHandoffTool extends ChatTool<typeof schema> {
  readonly name = 'request_human_handoff';
  readonly description =
    'Hand the conversation to the clinic staff. Use when the visitor asks for a person, when the answer is not ' +
    'in the provided knowledge, when the visitor is unhappy, or for anything needing professional judgement. ' +
    'Staff receive the transcript by email.';
  readonly schema = schema;

  constructor(
    private readonly conversations: ConversationsRepository,
    private readonly events: EventEmitter2,
  ) {
    super();
  }

  async execute(input: z.infer<typeof schema>, ctx: ChatToolContext): Promise<ChatToolResult> {
    const conversation = await this.conversations.findById(ctx.business.id, ctx.conversationId);
    if (conversation?.status === 'handed_off') {
      return { content: 'Already handed off; the team has been notified. Reassure the visitor someone will reply soon.' };
    }

    await this.conversations.setStatus(ctx.conversationId, 'handed_off');
    this.events.emit(DomainEvents.ConversationHandedOff, {
      businessId: ctx.business.id,
      conversationId: ctx.conversationId,
      reason: input.reason,
    } satisfies ConversationHandedOffEvent);

    ctx.emit({ type: 'handoff', message: 'Our team has been notified and will contact you shortly.' });
    return {
      content:
        'Handoff recorded and staff notified. If you do not have the visitor\'s phone number or email yet, ask for it ' +
        'so the team can reach them.',
    };
  }
}
