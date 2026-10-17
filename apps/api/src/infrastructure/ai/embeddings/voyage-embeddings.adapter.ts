import { Injectable, Logger } from '@nestjs/common';
import { AppConfig } from '@/config/app-config.service';
import { EMBEDDING_DIMENSIONS } from '@/infrastructure/database/schema';
import type { EmbeddingInputType, EmbeddingsPort } from './embeddings.port';

interface VoyageResponse {
  data: Array<{ embedding: number[]; index: number }>;
  usage?: { total_tokens: number };
}

/**
 * Voyage AI embeddings (Anthropic's recommended embeddings partner).
 * Batches input to stay within request limits and retries transient failures.
 */
@Injectable()
export class VoyageEmbeddingsAdapter implements EmbeddingsPort {
  private readonly logger = new Logger(VoyageEmbeddingsAdapter.name);
  readonly dimensions = EMBEDDING_DIMENSIONS;
  private static readonly BATCH_SIZE = 64;
  private static readonly ENDPOINT = 'https://api.voyageai.com/v1/embeddings';

  constructor(private readonly config: AppConfig) {}

  async embed(texts: string[], inputType: EmbeddingInputType): Promise<number[][]> {
    const results: number[][] = [];
    for (let i = 0; i < texts.length; i += VoyageEmbeddingsAdapter.BATCH_SIZE) {
      const batch = texts.slice(i, i + VoyageEmbeddingsAdapter.BATCH_SIZE);
      results.push(...(await this.embedBatch(batch, inputType)));
    }
    return results;
  }

  private async embedBatch(input: string[], inputType: EmbeddingInputType, attempt = 1): Promise<number[][]> {
    const res = await fetch(VoyageEmbeddingsAdapter.ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.get('VOYAGE_API_KEY')}`,
      },
      body: JSON.stringify({
        input,
        model: this.config.get('VOYAGE_MODEL'),
        input_type: inputType,
        output_dimension: this.dimensions,
      }),
    });

    if ((res.status === 429 || res.status >= 500) && attempt < 4) {
      const delay = 500 * 2 ** attempt;
      this.logger.warn(`Voyage returned ${res.status}, retrying in ${delay}ms`);
      await new Promise((r) => setTimeout(r, delay));
      return this.embedBatch(input, inputType, attempt + 1);
    }
    if (!res.ok) {
      throw new Error(`Voyage embeddings failed (${res.status}): ${await res.text()}`);
    }

    const body = (await res.json()) as VoyageResponse;
    return body.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
  }
}
