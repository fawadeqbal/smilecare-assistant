import type {
  ChatStreamEvent,
  SendMessageRequest,
  SessionHistoryResponse,
  StartSessionResponse,
  WidgetConfig,
} from '@smilecare/shared';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Thin client for the public widget endpoints. */
export class WidgetApi {
  constructor(
    private readonly baseUrl: string,
    private readonly widgetKey: string,
    private readonly visitorId: string,
  ) {}

  getConfig(): Promise<WidgetConfig> {
    return this.json(`/v1/widget/${encodeURIComponent(this.widgetKey)}/config`);
  }

  startSession(): Promise<StartSessionResponse> {
    return this.json('/v1/chat/sessions', {
      method: 'POST',
      body: JSON.stringify({ widgetKey: this.widgetKey, visitorId: this.visitorId }),
    });
  }

  getHistory(sessionId: string): Promise<SessionHistoryResponse> {
    const q = new URLSearchParams({ widgetKey: this.widgetKey, visitorId: this.visitorId });
    return this.json(`/v1/chat/sessions/${sessionId}/messages?${q}`);
  }

  /** Sends a message and invokes `onEvent` for each server-sent event as it arrives. */
  async sendMessage(
    sessionId: string,
    message: string,
    onEvent: (event: ChatStreamEvent) => void,
    signal?: AbortSignal,
  ): Promise<void> {
    const body: SendMessageRequest = { widgetKey: this.widgetKey, visitorId: this.visitorId, message };
    const res = await fetch(`${this.baseUrl}/v1/chat/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify(body),
      signal,
    });
    if (!res.ok || !res.body) throw new ApiError(res.status, await readError(res));

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let boundary: number;
      while ((boundary = buffer.indexOf('\n\n')) !== -1) {
        const frame = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        const data = frame
          .split('\n')
          .filter((line) => line.startsWith('data:'))
          .map((line) => line.slice(5).trimStart())
          .join('\n');
        if (data) onEvent(JSON.parse(data) as ChatStreamEvent);
      }
    }
  }

  private async json<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
    });
    if (!res.ok) throw new ApiError(res.status, await readError(res));
    return res.json() as Promise<T>;
  }
}

async function readError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return Array.isArray(body.message) ? body.message.join(', ') : body.message ?? res.statusText;
  } catch {
    return res.statusText || `HTTP ${res.status}`;
  }
}
