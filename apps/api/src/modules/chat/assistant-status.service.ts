import { Inject, Injectable, Logger } from '@nestjs/common';
import type { AssistantIssue, AssistantStatus } from '@smilecare/shared';
import Redis from 'ioredis';
import { LLM_PORT, LlmPort, LlmUnavailableError } from '@/infrastructure/ai/llm/llm.port';
import { InjectRedis } from '@/infrastructure/redis/redis.module';

const KEY = 'smilecare:assistant:issue';

/**
 * Remembers the last problem reaching the AI model (no key, no credit, ...) so the
 * dashboard can tell the owner what to fix. Stored in Redis so every API replica agrees;
 * cleared by the next successful reply.
 */
@Injectable()
export class AssistantStatusService {
  private readonly logger = new Logger(AssistantStatusService.name);

  constructor(
    @Inject(LLM_PORT) private readonly llm: LlmPort,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async get(): Promise<AssistantStatus> {
    const model = this.llm.modelName;
    if (!this.llm.isConfigured()) return { state: 'missing_key', since: null, model };
    const raw = await this.redis.get(KEY).catch(() => null);
    if (!raw) return { state: 'ready', since: null, model };
    const { reason, since } = JSON.parse(raw) as { reason: AssistantIssue; since: string };
    return { state: reason, since, model };
  }

  /** Sends a one-token request to the model so the owner can confirm a fix right away. */
  async check(): Promise<AssistantStatus> {
    if (!this.llm.isConfigured()) return this.get();
    try {
      await this.llm.streamChat({ system: 'Reply with OK.', messages: [{ role: 'user', content: [{ type: 'text', text: 'ping' }] }], maxTokens: 1 });
      await this.recordSuccess();
    } catch (err) {
      if (!(err instanceof LlmUnavailableError)) throw err;
      await this.recordIssue(err.reason);
    }
    return this.get();
  }

  async recordIssue(reason: AssistantIssue): Promise<void> {
    const raw = await this.redis.get(KEY).catch(() => null);
    const current = raw ? (JSON.parse(raw) as { reason: AssistantIssue; since: string }) : null;
    // Keep the first time we saw this same problem, so "since" means since when it's been broken.
    const since = current?.reason === reason ? current.since : new Date().toISOString();
    await this.redis.set(KEY, JSON.stringify({ reason, since })).catch((err) => this.logger.warn({ err }, 'Could not store assistant status'));
  }

  /** One cheap DEL per reply; keeps every replica honest without local caching. */
  async recordSuccess(): Promise<void> {
    await this.redis.del(KEY).catch(() => undefined);
  }
}

/**
 * What the visitor sees in the chat for each problem. Written for the person on the website,
 * with one plain line for the site owner, since in a demo they are usually the same person.
 */
export function visitorMessage(reason: AssistantIssue, businessName: string): string {
  const meanwhile = `You can still contact ${businessName} directly.`;
  switch (reason) {
    case 'missing_key':
      return `I'm not switched on yet: this assistant needs a Claude API key before it can answer. If you run this site, add your key as ANTHROPIC_API_KEY in the API settings and restart it. ${meanwhile}`;
    case 'invalid_key':
      return `I can't answer right now because the Claude API key was not accepted. If you run this site, check the key or create a new one in the Anthropic Console. ${meanwhile}`;
    case 'no_credit':
      return `I can't answer right now because the AI account behind this assistant has run out of credit. If you run this site, add credit in the Anthropic Console under Billing. ${meanwhile}`;
    case 'model_unavailable':
      return `I can't answer right now because the AI model this assistant is set to use isn't available on its API key. If you run this site, check the CLAUDE_MODEL setting. ${meanwhile}`;
    case 'rate_limited':
      return `Lots of people are asking questions right now. Please try again in a minute. ${meanwhile}`;
    case 'unavailable':
      return `The AI service I rely on isn't responding right now. Please try again in a few minutes. ${meanwhile}`;
  }
}
