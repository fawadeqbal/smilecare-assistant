import { profileFor } from './local-embeddings.adapter';

describe('profileFor', () => {
  it('uses query/passage prefixes for E5 models', () => {
    expect(profileFor('Xenova/multilingual-e5-small')).toEqual({ pooling: 'mean', queryPrefix: 'query: ', documentPrefix: 'passage: ' });
  });

  it('uses CLS pooling and a query instruction for BGE models', () => {
    const p = profileFor('Xenova/bge-small-en-v1.5');
    expect(p.pooling).toBe('cls');
    expect(p.queryPrefix).toMatch(/^Represent this sentence/);
    expect(p.documentPrefix).toBe('');
  });

  it('falls back to plain mean pooling', () => {
    expect(profileFor('Xenova/all-MiniLM-L6-v2')).toEqual({ pooling: 'mean', queryPrefix: '', documentPrefix: '' });
  });
});
