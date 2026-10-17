import { resolve } from 'node:path';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { FeatureExtractionPipeline } from '@huggingface/transformers';
import { AppConfig } from '@/config/app-config.service';
import { EMBEDDING_DIMENSIONS } from '@/infrastructure/database/schema';
import type { EmbeddingInputType, EmbeddingsPort } from './embeddings.port';

interface ModelProfile {
  pooling: 'mean' | 'cls';
  queryPrefix: string;
  documentPrefix: string;
}

/**
 * How each model family expects to be called. E5 models need "query:"/"passage:" prefixes;
 * BGE models use CLS pooling and an instruction on queries. Others use plain mean pooling.
 */
export function profileFor(model: string): ModelProfile {
  const id = model.toLowerCase();
  if (id.includes('e5')) return { pooling: 'mean', queryPrefix: 'query: ', documentPrefix: 'passage: ' };
  if (id.includes('bge')) {
    return { pooling: 'cls', queryPrefix: 'Represent this sentence for searching relevant passages: ', documentPrefix: '' };
  }
  return { pooling: 'mean', queryPrefix: '', documentPrefix: '' };
}

/**
 * Free, self-hosted embeddings: runs an open-source model (default: multilingual-e5-small,
 * 384 dimensions, ~120 MB quantized, understands Urdu and 90+ other languages) on the CPU
 * with ONNX Runtime via Transformers.js. No API key, no per-request cost, and documents
 * never leave the server.
 *
 * The model downloads from Hugging Face on first use and is cached in EMBEDDING_CACHE_DIR
 * (the Docker image bakes it in at build time). It is loaded once per process and reused.
 */
@Injectable()
export class LocalEmbeddingsAdapter implements EmbeddingsPort, OnModuleInit {
  private readonly logger = new Logger(LocalEmbeddingsAdapter.name);
  readonly dimensions = EMBEDDING_DIMENSIONS;
  private static readonly BATCH_SIZE = 32;
  private extractor: Promise<FeatureExtractionPipeline> | null = null;
  private readonly model: string;
  private readonly profile: ModelProfile;

  constructor(private readonly config: AppConfig) {
    this.model = config.get('EMBEDDING_MODEL');
    this.profile = profileFor(this.model);
  }

  /** Starts loading in the background so the first visitor question isn't slowed by model start-up. */
  onModuleInit() {
    if (this.config.get('EMBEDDING_PROVIDER') !== 'local') return;
    this.load().catch((err) => this.logger.error({ err }, 'Embedding model failed to load; will retry on next use'));
  }

  async embed(texts: string[], inputType: EmbeddingInputType): Promise<number[][]> {
    const extractor = await this.load();
    const prefix = inputType === 'query' ? this.profile.queryPrefix : this.profile.documentPrefix;
    const vectors: number[][] = [];

    for (let i = 0; i < texts.length; i += LocalEmbeddingsAdapter.BATCH_SIZE) {
      const batch = texts.slice(i, i + LocalEmbeddingsAdapter.BATCH_SIZE).map((t) => prefix + t);
      const output = await extractor(batch, { pooling: this.profile.pooling, normalize: true });
      vectors.push(...(output.tolist() as number[][]));
    }

    const actual = vectors[0]?.length;
    if (actual !== undefined && actual !== this.dimensions) {
      throw new Error(
        `Embedding model "${this.model}" returns ${actual} dimensions but the database expects ${this.dimensions}. ` +
          'Use a model with matching output size, or change EMBEDDING_DIMENSIONS and add a migration.',
      );
    }
    return vectors;
  }

  private load(): Promise<FeatureExtractionPipeline> {
    if (!this.extractor) {
      this.extractor = (async () => {
        const started = Date.now();
        const { pipeline, env } = await import('@huggingface/transformers');
        env.cacheDir = resolve(process.cwd(), this.config.get('EMBEDDING_CACHE_DIR'));
        const extractor = (await pipeline('feature-extraction', this.model, {
          dtype: this.config.get('EMBEDDING_DTYPE'),
        })) as FeatureExtractionPipeline;
        this.logger.log(`Loaded embedding model ${this.model} in ${Date.now() - started}ms`);
        return extractor;
      })();
      // Let a failed load be retried instead of caching the rejection forever.
      this.extractor.catch(() => (this.extractor = null));
    }
    return this.extractor;
  }
}
