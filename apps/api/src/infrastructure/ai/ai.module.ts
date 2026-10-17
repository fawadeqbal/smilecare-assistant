import { Global, Module } from '@nestjs/common';
import { AppConfig } from '@/config/app-config.service';
import { EMBEDDINGS_PORT } from './embeddings/embeddings.port';
import { HashEmbeddingsAdapter } from './embeddings/hash-embeddings.adapter';
import { LocalEmbeddingsAdapter } from './embeddings/local-embeddings.adapter';
import { AnthropicLlmAdapter } from './llm/anthropic-llm.adapter';
import { LLM_PORT } from './llm/llm.port';

/**
 * Binds AI ports to their adapters.
 * This is the single place to change when switching or adding a provider.
 */
@Global()
@Module({
  providers: [
    AnthropicLlmAdapter,
    LocalEmbeddingsAdapter,
    HashEmbeddingsAdapter,
    { provide: LLM_PORT, useExisting: AnthropicLlmAdapter },
    {
      provide: EMBEDDINGS_PORT,
      inject: [AppConfig, LocalEmbeddingsAdapter, HashEmbeddingsAdapter],
      useFactory: (config: AppConfig, local: LocalEmbeddingsAdapter, hash: HashEmbeddingsAdapter) =>
        config.get('EMBEDDING_PROVIDER') === 'hash' ? hash : local,
    },
  ],
  exports: [LLM_PORT, EMBEDDINGS_PORT],
})
export class AiModule {}
