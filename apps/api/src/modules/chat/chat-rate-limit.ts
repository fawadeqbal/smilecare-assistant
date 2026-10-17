import { ExecutionContext, SetMetadata } from '@nestjs/common';

const CHAT_RATE_LIMITED = 'chatRateLimited';

/**
 * Applies the stricter `chat` throttler (CHAT_RATE_LIMIT_MAX per window) to a route.
 * Sending messages costs LLM tokens, so it gets its own budget per visitor IP.
 */
export const ChatRateLimited = () => SetMetadata(CHAT_RATE_LIMITED, true);

export function isChatRateLimited(ctx: ExecutionContext): boolean {
  return Reflect.getMetadata(CHAT_RATE_LIMITED, ctx.getHandler()) === true;
}
