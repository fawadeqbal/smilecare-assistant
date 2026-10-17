/**
 * Provider-agnostic contract for chat models.
 *
 * The chat agent only talks to this interface. The Claude adapter maps it to the
 * Anthropic Messages API; adding another provider means writing one new adapter
 * and binding it to LLM_PORT, with no changes to the chat logic.
 */
export const LLM_PORT = Symbol('LLM_PORT');

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
  /** Streams text deltas through `handlers.onText` and resolves with the complete turn. */
  streamChat(request: LlmChatRequest, handlers?: LlmStreamHandlers): Promise<LlmChatResult>;
}
