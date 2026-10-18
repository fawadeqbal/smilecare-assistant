import { Module } from '@nestjs/common';
import { BookingsModule } from '@/modules/bookings/bookings.module';
import { BusinessesModule } from '@/modules/businesses/businesses.module';
import { ConversationsModule } from '@/modules/conversations/conversations.module';
import { KnowledgeModule } from '@/modules/knowledge/knowledge.module';
import { ChatAgentService } from './agent/chat-agent.service';
import { AssistantStatusController } from './assistant-status.controller';
import { AssistantStatusService } from './assistant-status.service';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { CHAT_TOOLS, ChatTool } from './tools/chat-tool';
import { CreateBookingTool } from './tools/create-booking.tool';
import { RequestHandoffTool } from './tools/request-handoff.tool';

/** Tools offered to Claude. Add a new ChatTool class here to give the assistant a new capability. */
const TOOL_CLASSES = [CreateBookingTool, RequestHandoffTool];

@Module({
  imports: [BusinessesModule, ConversationsModule, KnowledgeModule, BookingsModule],
  controllers: [ChatController, AssistantStatusController],
  providers: [
    ...TOOL_CLASSES,
    { provide: CHAT_TOOLS, inject: TOOL_CLASSES, useFactory: (...tools: ChatTool[]) => tools },
    ChatAgentService,
    AssistantStatusService,
    ChatService,
  ],
})
export class ChatModule {}
