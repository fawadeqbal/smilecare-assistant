import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { EMBEDDING_DIMENSIONS } from '@/infrastructure/database/schema';
import type { EmbeddingsPort } from './embeddings.port';

const STOPWORDS = new Set(
  'a an and are as at be by can do does for from have how i in is it me my of on or our please the to we what when where which who will with you your'.split(
    ' ',
  ),
);

/**
 * Deterministic embeddings from hashed word and bigram features.
 *
 * FOR TESTS ONLY: instant, needs no model download, and gives reproducible results.
 * It matches on shared words, not meaning, so real deployments use EMBEDDING_PROVIDER=local.
 */
@Injectable()
export class HashEmbeddingsAdapter implements EmbeddingsPort {
  readonly dimensions = EMBEDDING_DIMENSIONS;

  async embed(texts: string[]): Promise<number[][]> {
    return texts.map((t) => this.embedOne(t));
  }

  private embedOne(text: string): number[] {
    const vec = new Array<number>(this.dimensions).fill(0);
    const tokens = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 1 && !STOPWORDS.has(t))
      .map((t) => t.replace(/(ing|es|s)$/, ''));

    const features = [...tokens, ...tokens.slice(1).map((t, i) => `${tokens[i]}_${t}`)];
    for (const feature of features) {
      const hash = createHash('md5').update(feature).digest();
      const idx = hash.readUInt32BE(0) % this.dimensions;
      vec[idx] += hash[4] & 1 ? 1 : -1;
    }

    const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
    if (norm === 0) {
      vec[0] = 1;
      return vec;
    }
    return vec.map((v) => v / norm);
  }
}
