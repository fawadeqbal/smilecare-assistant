import type { LlmChatRequest, LlmChatResult, LlmContentBlock, LlmPort, LlmStreamHandlers } from '@/infrastructure/ai/llm/llm.port';

/**
 * Deterministic stand-in for Claude, used by e2e tests so the full chat pipeline
 * (retrieval, streaming, tool calls, persistence) runs without network access.
 *
 * Behaviour, based on the latest visitor turn:
 *  - after a tool result  -> a closing sentence
 *  - mentions "book"      -> calls create_booking
 *  - mentions "human"     -> calls request_human_handoff
 *  - otherwise            -> answers with the first price/time found in the system prompt
 */
export class ScriptedLlm implements LlmPort {
  readonly requests: LlmChatRequest[] = [];

  async streamChat(request: LlmChatRequest, handlers: LlmStreamHandlers = {}): Promise<LlmChatResult> {
    this.requests.push(request);
    const last = request.messages.at(-1);
    const blocks = last?.content ?? [];
    const toolResult = blocks.find((b) => b.type === 'tool_result');
    const userText = blocks
      .filter((b): b is Extract<LlmContentBlock, { type: 'text' }> => b.type === 'text')
      .map((b) => b.text)
      .join(' ')
      .toLowerCase();

    if (request.toolChoice === 'none') return this.say('Here is what I can tell you so far.', handlers);
    if (toolResult) return this.say(toolResult.isError ? 'Sorry, that did not work.' : 'All done! The team will call you to confirm.', handlers);

    if (userText.includes('book')) {
      return this.callTool('create_booking', {
        patient_name: 'Jane Doe',
        phone: '+1 555 123 4567',
        preferred_time: 'Tuesday afternoon',
        service: 'cleaning',
      }, 'Let me save that for you.', handlers);
    }

    if (userText.includes('human')) {
      return this.callTool('request_human_handoff', { reason: 'asked for a human' }, '', handlers);
    }

    const price = /\$\d[\d,]*/.exec(request.system)?.[0];
    return this.say(price ? `It costs ${price}.` : "I'm not sure about that.", handlers);
  }

  private say(text: string, handlers: LlmStreamHandlers): LlmChatResult {
    for (const word of text.split(/(?<= )/)) handlers.onText?.(word);
    return { content: [{ type: 'text', text }], stopReason: 'end_turn', usage: { inputTokens: 10, outputTokens: 5 }, model: 'scripted' };
  }

  private callTool(name: string, input: Record<string, unknown>, preface: string, handlers: LlmStreamHandlers): LlmChatResult {
    if (preface) handlers.onText?.(preface);
    return {
      content: [...(preface ? [{ type: 'text' as const, text: preface }] : []), { type: 'tool_call', id: `call_${name}`, name, input }],
      stopReason: 'tool_use',
      usage: { inputTokens: 10, outputTokens: 5 },
      model: 'scripted',
    };
  }
}
