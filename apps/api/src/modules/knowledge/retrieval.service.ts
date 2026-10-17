import { Inject, Injectable } from '@nestjs/common';
import type { KnowledgeSearchHit } from '@smilecare/shared';
import { AppConfig } from '@/config/app-config.service';
import { EMBEDDINGS_PORT, EmbeddingsPort } from '@/infrastructure/ai/embeddings/embeddings.port';
import { KnowledgeRepository } from './knowledge.repository';

export interface RetrievalOptions {
  limit?: number;
  /** Drop hits below this similarity. Defaults to RETRIEVAL_MIN_SCORE. Use 0 to keep everything. */
  minScore?: number;
}

/** Semantic search over a tenant's knowledge base. Used by chat and the admin "test a question" tool. */
@Injectable()
export class RetrievalService {
  constructor(
    @Inject(EMBEDDINGS_PORT) private readonly embeddings: EmbeddingsPort,
    private readonly repo: KnowledgeRepository,
    private readonly config: AppConfig,
  ) {}

  async search(businessId: string, query: string, options: RetrievalOptions = {}): Promise<KnowledgeSearchHit[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const [embedding] = await this.embeddings.embed([trimmed], 'query');
    const hits = await this.repo.searchChunks(
      businessId,
      embedding,
      options.limit ?? this.config.get('RETRIEVAL_TOP_K'),
      this.config.get('RETRIEVAL_EF_SEARCH'),
    );
    const minScore = options.minScore ?? this.config.get('RETRIEVAL_MIN_SCORE');
    return hits.filter((h) => h.score >= minScore);
  }
}
