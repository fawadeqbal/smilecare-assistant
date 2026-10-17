import type { ChatStreamEvent } from '@smilecare/shared';
import { z } from 'zod';
import type { LlmToolDefinition } from '@/infrastructure/ai/llm/llm.port';
import type { BusinessRow } from '@/infrastructure/database/schema';

/** Multi-provider token: every class registered under it is offered to Claude as a tool. */
export const CHAT_TOOLS = Symbol('CHAT_TOOLS');

export interface ChatToolContext {
  business: BusinessRow;
  conversationId: string;
  /** Push an event to the visitor's widget (e.g. a booking card). */
  emit: (event: ChatStreamEvent) => void;
}

export interface ChatToolResult {
  /** What Claude sees as the tool result. */
  content: string;
  isError?: boolean;
}

/**
 * Base class for tools Claude can call during a conversation.
 *
 * To add a capability (check availability, look up an order, create a CRM lead...):
 *   1. extend ChatTool with a zod input schema and an `execute` method,
 *   2. add the class to the CHAT_TOOLS provider list in chat.module.ts.
 * The agent loop, validation and streaming need no changes.
 */
export abstract class ChatTool<TSchema extends z.ZodObject = z.ZodObject> {
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly schema: TSchema;

  abstract execute(input: z.infer<TSchema>, ctx: ChatToolContext): Promise<ChatToolResult>;

  get definition(): LlmToolDefinition {
    const { $schema: _ignored, ...inputSchema } = z.toJSONSchema(this.schema) as Record<string, unknown>;
    return { name: this.name, description: this.description, inputSchema };
  }

  /** Validates model-provided input before executing, returning a readable error for Claude to correct. */
  async run(rawInput: unknown, ctx: ChatToolContext): Promise<ChatToolResult> {
    const parsed = this.schema.safeParse(rawInput);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => `${i.path.join('.') || 'input'}: ${i.message}`).join('; ');
      return { content: `Invalid input: ${issues}. Ask the visitor for the missing or incorrect details.`, isError: true };
    }
    return this.execute(parsed.data, ctx);
  }
}
