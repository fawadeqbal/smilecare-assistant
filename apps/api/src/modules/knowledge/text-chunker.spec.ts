import { chunkText } from './text-chunker';

describe('chunkText', () => {
  const opts = { maxChars: 200, overlapChars: 40 };

  it('returns nothing for empty input', () => {
    expect(chunkText('   \n\n ', opts)).toEqual([]);
  });

  it('keeps short text in one chunk', () => {
    expect(chunkText('Open Monday to Friday.', opts)).toEqual(['Open Monday to Friday.']);
  });

  it('prefixes each chunk with its nearest markdown heading', () => {
    const chunks = chunkText('# Prices\n\nCleaning: $119\n\n## Hours\n\nMon-Fri 9-7', opts);
    expect(chunks).toEqual(['Prices\n\nCleaning: $119', 'Hours\n\nMon-Fri 9-7']);
  });

  it('never exceeds the size budget and overlaps consecutive chunks', () => {
    const paragraphs = Array.from({ length: 12 }, (_, i) => `Paragraph ${i} talks about dental topic number ${i} in some detail.`);
    const chunks = chunkText(paragraphs.join('\n\n'), opts);

    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) expect(c.length).toBeLessThanOrEqual(opts.maxChars);
    // The start of each chunk after the first repeats words from the end of the previous one.
    for (let i = 1; i < chunks.length; i++) {
      const firstWords = chunks[i].split(' ').slice(0, 3).join(' ');
      expect(chunks[i - 1]).toContain(firstWords);
    }
  });

  it('splits a single oversized paragraph on sentence boundaries', () => {
    const sentence = 'This sentence is about forty characters. ';
    const chunks = chunkText(sentence.repeat(20), { maxChars: 120, overlapChars: 0 });
    for (const c of chunks) {
      expect(c.length).toBeLessThanOrEqual(120);
      expect(c.endsWith('.')).toBe(true);
    }
  });

  it('rejects an overlap larger than the chunk size', () => {
    expect(() => chunkText('x', { maxChars: 10, overlapChars: 10 })).toThrow();
  });
});
