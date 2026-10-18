/**
 * Provider-agnostic contract for chat models.
 *
 * The chat agent only talks to this interface. The Claude adapter maps it to the
 * Anthropic Messages API; adding another provider means writing one new adapter
 * and binding it to LLM_PORT, with no changes to the chat logic.
 */
import type { AssistantIssue } from '@smilecare/shared';

export const LLM_PORT = Symbol('LLM_PORT');

/**
 * Thrown by adapters when the model can't be used for a reason the site owner (or time)
 * has to fix: no key, a rejected key, no credit, an unknown model, or the provider being down.
 * Anything else is an ordinary bug and is thrown as-is.
 */
export class LlmUnavailableError extends Error {
  constructor(
    readonly reason: AssistantIssue,
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = 'LlmUnavailableError';
  }
}

export type LlmContentBlock =
  | { type: 'text'; text: string }
  | { type: 'tool_call'; id: string; name: string; input: Record<string, unknown> }
  | { type: 'tool_result'; toolCallId: string; content: string; isError?: boolean };

export interface LlmMessage {
  role: 'user' | 'assistant';
  content: LlmContentBlock[];
}

export interface LlmToolDefinition {
  name: string;
  description: string;
  /** JSON Schema for the tool input. */
  inputSchema: Record<string, unknown>;
}

export interface LlmChatRequest {
  system: string;
  messages: LlmMessage[];
  tools?: LlmToolDefinition[];
  /** `none` keeps tools visible to the model but forbids calling them (forces a text answer). */
  toolChoice?: 'auto' | 'none';
  maxTokens?: number;
  temperature?: number;
  /** Aborts the upstream request, e.g. when the visitor closes the widget. */
  signal?: AbortSignal;
}

export type LlmStopReason = 'end_turn' | 'tool_use' | 'max_tokens' | 'refusal' | 'other';

export interface LlmUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface LlmChatResult {
  content: LlmContentBlock[];
  stopReason: LlmStopReason;
  usage: LlmUsage;
  model: string;
}

export interface LlmStreamHandlers {
  onText?: (delta: string) => void;
}

export interface LlmPort {
  /** Streams text deltas through `handlers.onText` and resolves with the complete turn. Throws LlmUnavailableError for setup/provider problems. */
  streamChat(request: LlmChatRequest, handlers?: LlmStreamHandlers): Promise<LlmChatResult>;
  /** False when the adapter has no credentials at all, so it can't possibly answer. */
  isConfigured(): boolean;
  /** The model name, for status displays. */
  readonly modelName: string;
}
