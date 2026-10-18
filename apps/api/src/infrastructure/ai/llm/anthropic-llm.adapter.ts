import Anthropic from '@anthropic-ai/sdk';
import { Injectable, Logger } from '@nestjs/common';
import { AppConfig } from '@/config/app-config.service';
import {
  LlmUnavailableError,
  type LlmChatRequest,
  type LlmChatResult,
  type LlmContentBlock,
  type LlmMessage,
  type LlmPort,
  type LlmStopReason,
  type LlmStreamHandlers,
} from './llm.port';

/** Claude (Anthropic Messages API) implementation of the LLM port. */
@Injectable()
export class AnthropicLlmAdapter implements LlmPort {
  private readonly logger = new Logger(AnthropicLlmAdapter.name);
  private readonly client: Anthropic;
  private readonly apiKey: string;
  private readonly model: string;
  private readonly defaultMaxTokens: number;

  constructor(config: AppConfig) {
    this.apiKey = config.get('ANTHROPIC_API_KEY').trim();
    this.client = new Anthropic({
      // `null` (not undefined) so the SDK doesn't silently fall back to another env variable.
      apiKey: this.apiKey || null,
      maxRetries: 2,
      timeout: 60_000,
    });
    this.model = config.get('CLAUDE_MODEL');
    this.defaultMaxTokens = config.get('CLAUDE_MAX_TOKENS');
    if (!this.apiKey) {
      this.logger.warn('ANTHROPIC_API_KEY is not set. The chat will tell visitors it needs a key until you add one to apps/api/.env and restart.');
    }
  }

  get modelName(): string {
    return this.model;
  }

  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  async streamChat(request: LlmChatRequest, handlers: LlmStreamHandlers = {}): Promise<LlmChatResult> {
    if (!this.isConfigured()) {
      throw new LlmUnavailableError('missing_key', 'ANTHROPIC_API_KEY is not set');
    }
    try {
      return await this.runStream(request, handlers);
    } catch (err) {
      throw toUnavailableError(err, this.model) ?? err;
    }
  }

  private async runStream(request: LlmChatRequest, handlers: LlmStreamHandlers): Promise<LlmChatResult> {
    const stream = this.client.messages.stream(
      {
        model: this.model,
        max_tokens: request.maxTokens ?? this.defaultMaxTokens,
        system: request.system,
        messages: request.messages.map(toAnthropicMessage),
        ...(request.tools?.length
          ? {
              tools: request.tools.map((t) => ({
                name: t.name,
                description: t.description,
                input_schema: t.inputSchema as Anthropic.Tool.InputSchema,
              })),
              tool_choice: { type: request.toolChoice ?? 'auto' },
            }
          : {}),
        ...(request.temperature !== undefined ? { temperature: request.temperature } : {}),
      },
      { signal: request.signal },
    );

    if (handlers.onText) stream.on('text', (delta) => handlers.onText!(delta));

    const message = await stream.finalMessage();
    this.logger.debug(
      `Claude turn: stop=${message.stop_reason} in=${message.usage.input_tokens} out=${message.usage.output_tokens}`,
    );

    return {
      model: message.model,
      stopReason: mapStopReason(message.stop_reason),
      usage: { inputTokens: message.usage.input_tokens, outputTokens: message.usage.output_tokens },
      content: message.content.flatMap((block): LlmContentBlock[] => {
        if (block.type === 'text') return block.text ? [{ type: 'text', text: block.text }] : [];
        if (block.type === 'tool_use') {
          return [{ type: 'tool_call', id: block.id, name: block.name, input: (block.input ?? {}) as Record<string, unknown> }];
        }
        return [];
      }),
    };
  }
}

/** Maps provider errors that need the owner's attention (or a retry) onto LlmUnavailableError. */
export function toUnavailableError(err: unknown, model: string): LlmUnavailableError | null {
  if (err instanceof Anthropic.APIUserAbortError) return null;
  const detail = err instanceof Error ? err.message : String(err);
  const type = (err as { error?: { error?: { type?: string } } })?.error?.error?.type;

  if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
    return new LlmUnavailableError('invalid_key', `Claude rejected the API key: ${detail}`, { cause: err });
  }
  if (type === 'billing_error' || /credit balance|billing|purchase credits/i.test(detail)) {
    return new LlmUnavailableError('no_credit', `The Anthropic account has no credit left: ${detail}`, { cause: err });
  }
  if (err instanceof Anthropic.NotFoundError || (err instanceof Anthropic.BadRequestError && /model/i.test(detail) && /not|invalid|unknown/i.test(detail))) {
    return new LlmUnavailableError('model_unavailable', `Model "${model}" is not available to this API key: ${detail}`, { cause: err });
  }
  if (err instanceof Anthropic.RateLimitError) {
    return new LlmUnavailableError('rate_limited', `Claude rate limit reached: ${detail}`, { cause: err });
  }
  if (err instanceof Anthropic.InternalServerError || err instanceof Anthropic.APIConnectionError) {
    return new LlmUnavailableError('unavailable', `Claude is unreachable or overloaded: ${detail}`, { cause: err });
  }
  return null;
}

function toAnthropicMessage(message: LlmMessage): Anthropic.MessageParam {
  return {
    role: message.role,
    // The API rejects empty text blocks, which can appear in a tool-only assistant turn.
    content: message.content
      .filter((block) => block.type !== 'text' || block.text.trim() !== '')
      .map((block): Anthropic.ContentBlockParam => {
      switch (block.type) {
        case 'text':
          return { type: 'text', text: block.text };
        case 'tool_call':
          return { type: 'tool_use', id: block.id, name: block.name, input: block.input };
        case 'tool_result':
          return {
            type: 'tool_result',
            tool_use_id: block.toolCallId,
            content: block.content,
            ...(block.isError ? { is_error: true } : {}),
          };
      }
    }),
  };
}

function mapStopReason(reason: Anthropic.StopReason | null): LlmStopReason {
  switch (reason) {
    case 'end_turn':
    case 'stop_sequence':
      return 'end_turn';
    case 'tool_use':
      return 'tool_use';
    case 'max_tokens':
    case 'model_context_window_exceeded':
      return 'max_tokens';
    case 'refusal':
      return 'refusal';
    default:
      return 'other';
  }
}
