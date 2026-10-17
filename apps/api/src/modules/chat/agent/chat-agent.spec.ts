import type { BusinessRow } from '@/infrastructure/database/schema';
import { buildRetrievalQuery, toLlmMessages } from './chat-agent.service';
import { buildSystemPrompt } from './prompt-builder';

describe('toLlmMessages', () => {
  it('merges consecutive messages from the same role and drops leading assistant turns', () => {
    const out = toLlmMessages([
      { role: 'assistant', content: 'Welcome!' },
      { role: 'user', content: 'Hi' },
      { role: 'user', content: 'Are you open?' },
      { role: 'assistant', content: 'Yes.' },
      { role: 'system', content: 'ignored' },
    ]);
    expect(out).toEqual([
      { role: 'user', content: [{ type: 'text', text: 'Hi' }, { type: 'text', text: 'Are you open?' }] },
      { role: 'assistant', content: [{ type: 'text', text: 'Yes.' }] },
    ]);
  });
});

describe('buildRetrievalQuery', () => {
  const history = [
    { role: 'user' as const, content: 'What are your opening hours on weekdays?' },
    { role: 'assistant' as const, content: '9 to 7.' },
    { role: 'user' as const, content: 'and saturday?' },
  ];

  it('combines a short follow-up with the previous visitor question', () => {
    expect(buildRetrievalQuery(history, 'and saturday?')).toBe('What are your opening hours on weekdays?\nand saturday?');
  });

  it('uses a full question as-is', () => {
    const q = 'How much does a porcelain crown cost at your clinic?';
    expect(buildRetrievalQuery(history, q)).toBe(q);
  });
});

describe('buildSystemPrompt', () => {
  const business = { name: 'SmileCare', botName: 'Sunny', timezone: 'UTC' } as BusinessRow;

  it('includes retrieved knowledge with titles', () => {
    const prompt = buildSystemPrompt({
      business,
      conversationStatus: 'open',
      hits: [{ chunkId: 'c1', documentId: 'd1', documentTitle: 'Prices', content: 'Cleaning: $119', score: 0.8 }],
      now: new Date('2026-10-17T12:00:00Z'),
    });
    expect(prompt).toContain('You are Sunny');
    expect(prompt).toContain('<document index="1" title="Prices">\nCleaning: $119\n</document>');
    expect(prompt).toContain('Saturday, October 17, 2026');
  });

  it('marks an empty knowledge result explicitly and warns when already handed off', () => {
    const prompt = buildSystemPrompt({ business, conversationStatus: 'handed_off', hits: [] });
    expect(prompt).toContain('<no_relevant_documents/>');
    expect(prompt).toContain('ALREADY been handed to staff');
  });
});
