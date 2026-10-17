import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ChatStreamEvent, KnowledgeSearchHit, MessageSource } from '@smilecare/shared';
import { AppConfig } from '@/config/app-config.service';
import { LLM_PORT, LlmContentBlock, LlmMessage, LlmPort, LlmUsage } from '@/infrastructure/ai/llm/llm.port';
import type { BusinessRow, ConversationRow, MessageRow } from '@/infrastructure/database/schema';
import { ConversationsRepository } from '@/modules/conversations/conversations.repository';
import { RetrievalService } from '@/modules/knowledge/retrieval.service';
import { CHAT_TOOLS, ChatTool } from '../tools/chat-tool';
import { buildSystemPrompt } from './prompt-builder';

export interface HandleMessageInput {
  business: BusinessRow;
  conversation: ConversationRow;
  text: string;
  emit: (event: ChatStreamEvent) => void;
  signal?: AbortSignal;
}

const FALLBACK_REPLY = "Sorry, I couldn't put together an answer just now. Would you like me to connect you with our team?";

/**
 * The conversation loop: retrieve context, ask Claude, run any tools Claude calls,
 * and repeat until Claude gives a final answer. Provider-agnostic: it only uses the
 * LLM port, the retrieval service and the tool registry.
 */
@Injectable()
export class ChatAgentService {
  private readonly logger = new Logger(ChatAgentService.name);
  private readonly toolsByName: Map<string, ChatTool>;

  constructor(
    @Inject(LLM_PORT) private readonly llm: LlmPort,
    @Inject(CHAT_TOOLS) tools: ChatTool[],
    private readonly retrieval: RetrievalService,
    private readonly conversations: ConversationsRepository,
    private readonly config: AppConfig,
  ) {
    this.toolsByName = new Map(tools.map((t) => [t.name, t]));
  }

  async handleMessage({ business, conversation, text, emit, signal }: HandleMessageInput): Promise<void> {
    await this.conversations.addMessage({ conversationId: conversation.id, role: 'user', content: text });
    const history = await this.conversations.recentMessages(conversation.id, this.config.get('CHAT_HISTORY_LIMIT'));

    const hits = await this.retrieval.search(business.id, buildRetrievalQuery(history, text));
    const sources: MessageSource[] = hits.map(toSource);

    const system = buildSystemPrompt({ business, hits, conversationStatus: conversation.status });
    const messages = toLlmMessages(history);
    const toolDefinitions = [...this.toolsByName.values()].map((t) => t.definition);

    let reply = '';
    const usage: LlmUsage = { inputTokens: 0, outputTokens: 0 };
    const toolCalls: Array<{ name: string; ok: boolean }> = [];
    let model = '';
    let finished = false;

    for (let round = 0; round < this.config.get('CHAT_MAX_TOOL_ROUNDS') && !finished; round++) {
      let roundText = '';
      const needsSeparator = reply.length > 0;

      const result = await this.llm.streamChat(
        { system, messages, tools: toolDefinitions, signal },
        {
          onText: (delta) => {
            if (!roundText && needsSeparator) emit({ type: 'delta', text: '\n\n' });
            roundText += delta;
            emit({ type: 'delta', text: delta });
          },
        },
      );

      model = result.model;
      usage.inputTokens += result.usage.inputTokens;
      usage.outputTokens += result.usage.outputTokens;
      if (roundText) reply += (needsSeparator ? '\n\n' : '') + roundText;

      const calls = result.content.filter((b): b is Extract<LlmContentBlock, { type: 'tool_call' }> => b.type === 'tool_call');
      if (result.stopReason !== 'tool_use' || calls.length === 0) {
        finished = true;
        break;
      }

      messages.push({ role: 'assistant', content: result.content });
      const results: LlmContentBlock[] = [];
      for (const call of calls) {
        const outcome = await this.runTool(call, { business, conversationId: conversation.id, emit });
        toolCalls.push({ name: call.name, ok: !outcome.isError });
        results.push({ type: 'tool_result', toolCallId: call.id, content: outcome.content, isError: outcome.isError });
      }
      messages.push({ role: 'user', content: results });
    }

    if (!reply.trim()) {
      reply = FALLBACK_REPLY;
      emit({ type: 'delta', text: reply });
    }

    const saved = await this.conversations.addMessage({
      conversationId: conversation.id,
      role: 'assistant',
      content: reply.trim(),
      sources,
      metadata: { model, usage, toolCalls, retrieval: hits.map((h) => ({ chunkId: h.chunkId, score: round3(h.score) })) },
    });
    await this.conversations.touch(conversation.id);

    const updated = await this.conversations.findById(business.id, conversation.id);
    emit({ type: 'done', messageId: saved.id, conversationStatus: updated?.status ?? conversation.status, sources });
  }

  private async runTool(
    call: { id: string; name: string; input: Record<string, unknown> },
    ctx: Parameters<ChatTool['run']>[1],
  ) {
    const tool = this.toolsByName.get(call.name);
    if (!tool) return { content: `Unknown tool "${call.name}"`, isError: true };

    ctx.emit({ type: 'tool', name: call.name, status: 'started' });
    try {
      const outcome = await tool.run(call.input, ctx);
      ctx.emit({ type: 'tool', name: call.name, status: outcome.isError ? 'failed' : 'completed' });
      return outcome;
    } catch (err) {
      this.logger.error({ err, tool: call.name }, 'Tool execution failed');
      ctx.emit({ type: 'tool', name: call.name, status: 'failed' });
      return { content: 'The action failed due to a system error. Apologise and offer to connect the visitor with staff.', isError: true };
    }
  }
}

/**
 * Short follow-ups ("and on Saturday?") don't retrieve well on their own,
 * so they're combined with the previous visitor message.
 */
export function buildRetrievalQuery(history: Pick<MessageRow, 'role' | 'content'>[], current: string): string {
  if (current.split(/\s+/).length >= 6) return current;
  const previousUser = [...history].reverse().filter((m) => m.role === 'user').map((m) => m.content).find((c) => c !== current);
  return previousUser ? `${previousUser}\n${current}` : current;
}

/** Maps stored messages to alternating user/assistant turns, as the Messages API requires. */
export function toLlmMessages(history: Pick<MessageRow, 'role' | 'content'>[]): LlmMessage[] {
  const out: LlmMessage[] = [];
  for (const m of history) {
    if (m.role === 'system' || !m.content.trim()) continue;
    const last = out.at(-1);
    if (last && last.role === m.role) {
      last.content.push({ type: 'text', text: m.content });
    } else {
      out.push({ role: m.role, content: [{ type: 'text', text: m.content }] });
    }
  }
  while (out.length && out[0].role !== 'user') out.shift();
  return out;
}

function toSource(hit: KnowledgeSearchHit): MessageSource {
  return { chunkId: hit.chunkId, documentId: hit.documentId, documentTitle: hit.documentTitle, score: round3(hit.score) };
}

function round3(n: number) {
  return Math.round(n * 1000) / 1000;
}
