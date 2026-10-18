import Anthropic from '@anthropic-ai/sdk';
import { toUnavailableError } from './anthropic-llm.adapter';

const apiError = (status: number, type: string, message: string) =>
  Anthropic.APIError.generate(status, { type: 'error', error: { type, message } }, message, new Headers());

describe('toUnavailableError', () => {
  it.each([
    [apiError(401, 'authentication_error', 'invalid x-api-key'), 'invalid_key'],
    [apiError(400, 'invalid_request_error', 'Your credit balance is too low to access the Anthropic API.'), 'no_credit'],
    [apiError(400, 'billing_error', 'Billing issue'), 'no_credit'],
    [apiError(404, 'not_found_error', 'model: claude-nope'), 'model_unavailable'],
    [apiError(429, 'rate_limit_error', 'Too many requests'), 'rate_limited'],
    [apiError(529, 'overloaded_error', 'Overloaded'), 'unavailable'],
    [new Anthropic.APIConnectionError({ message: 'socket hang up' }), 'unavailable'],
  ])('maps %s to %s', (err, reason) => {
    expect(toUnavailableError(err, 'claude-test')?.reason).toBe(reason);
  });

  it('leaves aborts and ordinary bugs alone', () => {
    expect(toUnavailableError(new Anthropic.APIUserAbortError(), 'm')).toBeNull();
    expect(toUnavailableError(apiError(400, 'invalid_request_error', 'messages: text content blocks must be non-empty'), 'm')).toBeNull();
    expect(toUnavailableError(new TypeError('boom'), 'm')).toBeNull();
  });
});
