export interface ChunkOptions {
  /** Target maximum characters per chunk (~4 chars per token). */
  maxChars: number;
  /** Characters carried over from the end of the previous chunk. */
  overlapChars: number;
}

/**
 * Splits text into retrieval chunks.
 *
 * Strategy: split on paragraph boundaries (blank lines / markdown headings), then pack
 * paragraphs into chunks up to `maxChars`. Oversized paragraphs are split on sentence
 * boundaries, and as a last resort hard-wrapped. Each new chunk starts with the tail of
 * the previous one so facts that straddle a boundary are still retrievable.
 *
 * The nearest markdown heading is prefixed to each chunk, which noticeably improves
 * retrieval for short, list-like documents such as price lists and FAQs.
 */
export function chunkText(text: string, { maxChars, overlapChars }: ChunkOptions): string[] {
  if (overlapChars >= maxChars) throw new Error('overlapChars must be smaller than maxChars');

  const normalized = text.replace(/\r\n/g, '\n').replace(/[ \t]+\n/g, '\n').trim();
  if (!normalized) return [];

  const sections = splitSections(normalized);
  const chunks: string[] = [];

  for (const { heading, body } of sections) {
    const pieces = body
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean)
      .flatMap((p) => (p.length > maxChars ? splitLong(p, maxChars) : [p]));

    const prefix = heading ? `${heading}\n\n` : '';
    const budget = Math.max(maxChars - prefix.length, Math.floor(maxChars / 2));
    let current = '';

    const flush = () => {
      if (current.trim()) chunks.push(prefix + current.trim());
    };

    for (const piece of pieces) {
      if (!current) {
        current = piece;
      } else if (current.length + 2 + piece.length <= budget) {
        current += `\n\n${piece}`;
      } else {
        flush();
        const tail = overlapChars > 0 ? takeTail(current, overlapChars) : '';
        current = tail && tail.length + 2 + piece.length <= budget ? `${tail}\n\n${piece}` : piece;
      }
    }
    flush();
  }

  return chunks;
}

interface Section {
  heading: string | null;
  body: string;
}

function splitSections(text: string): Section[] {
  const lines = text.split('\n');
  const sections: Section[] = [];
  let heading: string | null = null;
  let buffer: string[] = [];

  const push = () => {
    const body = buffer.join('\n').trim();
    if (body) sections.push({ heading, body });
    buffer = [];
  };

  for (const line of lines) {
    const match = /^#{1,6}\s+(.+)$/.exec(line);
    if (match) {
      push();
      heading = match[1].trim();
    } else {
      buffer.push(line);
    }
  }
  push();
  return sections.length ? sections : [{ heading: null, body: text }];
}

function splitLong(paragraph: string, maxChars: number): string[] {
  const sentences = paragraph.match(/[^.!?\n]+(?:[.!?]+|\n|$)/g)?.map((s) => s.trim()).filter(Boolean) ?? [paragraph];
  const out: string[] = [];
  let current = '';
  for (const sentence of sentences) {
    if (sentence.length > maxChars) {
      if (current) out.push(current);
      current = '';
      for (let i = 0; i < sentence.length; i += maxChars) out.push(sentence.slice(i, i + maxChars));
      continue;
    }
    if (current && current.length + 1 + sentence.length > maxChars) {
      out.push(current);
      current = sentence;
    } else {
      current = current ? `${current} ${sentence}` : sentence;
    }
  }
  if (current) out.push(current);
  return out;
}

function takeTail(text: string, chars: number): string {
  if (text.length <= chars) return text;
  const slice = text.slice(-chars);
  // Start at a word boundary so the overlap doesn't begin mid-word.
  const firstSpace = slice.indexOf(' ');
  return firstSpace > 0 ? slice.slice(firstSpace + 1) : slice;
}
